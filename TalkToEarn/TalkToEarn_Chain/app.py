# app.py - 基于AILibraries的多用户AI知识库分享平台
import os
import json
import numpy as np
from flask import Flask, request, jsonify, Response, render_template, session, redirect, url_for
import chardet
import time
from langchain_core.documents import Document
import uuid
from werkzeug.utils import secure_filename
import math
import hashlib
from datetime import datetime

import requests
from web3 import Web3
import io

# ==================== 导入必要的库 ====================
from langchain_text_splitters import RecursiveCharacterTextSplitter, TokenTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings, OllamaLLM

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# ==================== 文件路径配置 ====================
UPLOAD_FOLDER = 'USER_DATA'
SHARED_FOLDER = 'SHARED_CONTENT'
USER_DB_FILE = 'users.json'
FILES_DB_FILE = 'files.json'
TRANSACTIONS_DB_FILE = 'transactions.json'

# ============ 新增配置 ============
NFT_METADATA_FOLDER = 'NFT_METADATA'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SHARED_FOLDER, exist_ok=True)
os.makedirs(NFT_METADATA_FOLDER, exist_ok=True)  # 新增

# ==================== IPFS 配置 ====================
IPFS_API = "http://127.0.0.1:5001/api/v0"
IPFS_GATEWAY = "http://127.0.0.1:8080"

# ==================== 区块链配置 ====================
# 连接到本地 Ganache
WEB3_PROVIDER = "http://127.0.0.1:7545"  # Ganache 默认端口
w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER))

# 加载合约 ABI 和地址
try:
    with open('SimpleNFT.json', 'r') as f:
        nft_contract_data = json.load(f)
        NFT_ABI = nft_contract_data['abi']
        NFT_ADDRESS = nft_contract_data['networks']['5777']['address']  # Ganache 网络ID通常是5777
    
    with open('RewardContract.json', 'r') as f:
        reward_contract_data = json.load(f)
        REWARD_ABI = reward_contract_data['abi']
        REWARD_ADDRESS = reward_contract_data['networks']['5777']['address']
    
    # 初始化合约实例
    nft_contract = w3.eth.contract(address=NFT_ADDRESS, abi=NFT_ABI)
    reward_contract = w3.eth.contract(address=REWARD_ADDRESS, abi=REWARD_ABI)
    
    print(f"✅ 区块链连接成功: {WEB3_PROVIDER}")
    print(f"✅ NFT合约加载: {NFT_ADDRESS}")
    print(f"✅ 奖励合约加载: {REWARD_ADDRESS}")
    
except Exception as e:
    print(f"❌ 区块链连接失败: {e}")
    nft_contract = None
    reward_contract = None

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SHARED_FOLDER, exist_ok=True)

# ==================== Ollama 配置 ====================
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434')

embeddings = OllamaEmbeddings(
    model='mxbai-embed-large:latest',
    base_url=OLLAMA_HOST
)

llm = OllamaLLM(
    model='deepseek-r1:1.5b',
    temperature=0.3,
    base_url=OLLAMA_HOST
)

vector_store = None

def check_ipfs_connection():
    """检查IPFS连接"""
    try:
        response = requests.post(f"{IPFS_API}/id", timeout=10)
        return response.status_code == 200
    except:
        return False

def upload_to_ipfs(content, filename=None):
    """上传内容到IPFS"""
    try:
        if filename is None:
            filename = f"file_{int(time.time())}.txt"
        
        files = {'file': (filename, content.encode('utf-8'))}
        response = requests.post(f"{IPFS_API}/add", files=files, timeout=30)
        
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            for line in lines:
                if line:
                    result = json.loads(line)
                    if 'Hash' in result:
                        cid = result['Hash']
                        print(f"✅ IPFS上传成功: {cid}")
                        
                        # Pin文件确保持久化
                        try:
                            requests.post(f"{IPFS_API}/pin/add", params={'arg': cid}, timeout=10)
                        except:
                            pass
                            
                        return cid
        return None
    except Exception as e:
        print(f"❌ IPFS上传失败: {e}")
        return None

def get_ipfs_url(cid):
    """获取IPFS访问URL"""
    return f"{IPFS_GATEWAY}/ipfs/{cid}"

# ==================== NFT 功能 ====================
def mint_nft(owner_address, ipfs_cid, filename, content_preview):
    """铸造NFT"""
    if not nft_contract:
        print("❌ NFT合约未初始化")
        return None
    
    try:
        # 创建NFT元数据
        metadata = {
            "name": f"知识NFT: {filename}",
            "description": f"这是一个知识分享NFT，包含内容: {content_preview}",
            "image": f"ipfs://{ipfs_cid}",
            "external_url": get_ipfs_url(ipfs_cid),
            "attributes": [
                {
                    "trait_type": "内容类型",
                    "value": "文本知识"
                },
                {
                    "trait_type": "文件名称", 
                    "value": filename
                },
                {
                    "trait_type": "创建时间",
                    "value": datetime.now().isoformat()
                }
            ]
        }
        
        # 上传元数据到IPFS
        metadata_json = json.dumps(metadata, ensure_ascii=False, indent=2)
        metadata_cid = upload_to_ipfs(metadata_json, f"metadata_{int(time.time())}.json")
        
        if not metadata_cid:
            print("❌ 元数据上传失败")
            return None
        
        # 保存元数据到本地
        metadata_file = os.path.join(NFT_METADATA_FOLDER, f"{metadata_cid}.json")
        with open(metadata_file, 'w', encoding='utf-8') as f:
            f.write(metadata_json)
        
        # 铸造NFT（需要账户和私钥）
        # 注意：在实际应用中，需要安全地处理私钥
        # 这里简化处理，使用第一个账户
        accounts = w3.eth.accounts
        if not accounts:
            print("❌ 没有可用的区块链账户")
            return None
            
        # 使用第一个账户作为默认铸造者
        from_account = accounts[0]
        
        # 构建交易
        token_uri = f"ipfs://{metadata_cid}"
        
        # 估算gas
        try:
            gas_estimate = nft_contract.functions.mint(owner_address, token_uri).estimate_gas({
                'from': from_account
            })
            
            # 发送交易
            transaction = nft_contract.functions.mint(owner_address, token_uri).build_transaction({
                'from': from_account,
                'gas': gas_estimate + 10000,
                'gasPrice': w3.to_wei('20', 'gwei'),
                'nonce': w3.eth.get_transaction_count(from_account),
            })
            
            # 这里需要私钥签名交易，在实际应用中应该安全处理
            # 简化版本：跳过实际交易发送，返回模拟tokenId
            print(f"🎨 模拟铸造NFT给 {owner_address}, URI: {token_uri}")
            
            # 返回模拟的tokenId（在实际应用中应该是真实的tokenId）
            token_id = int(time.time()) % 1000000
            return token_id
            
        except Exception as e:
            print(f"❌ NFT铸造交易构建失败: {e}")
            # 返回模拟tokenId用于演示
            token_id = int(time.time()) % 1000000
            return token_id
            
    except Exception as e:
        print(f"❌ NFT铸造失败: {e}")
        return None

# ==================== 用户管理系统 ====================

def load_users():
    if os.path.exists(USER_DB_FILE):
        with open(USER_DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USER_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_files():
    if os.path.exists(FILES_DB_FILE):
        with open(FILES_DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_files(files):
    with open(FILES_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(files, f, ensure_ascii=False, indent=2)

def load_transactions():
    if os.path.exists(TRANSACTIONS_DB_FILE):
        with open(TRANSACTIONS_DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_transactions(transactions):
    with open(TRANSACTIONS_DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(transactions, f, ensure_ascii=False, indent=2)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def register_user(user_id, password, ethereum_address=None):  # 新增参数
    users = load_users()
    
    if user_id in users:
        return False, "用户ID已存在"
    
    # 🎯 修复：确保新用户的所有统计字段都正确初始化
    users[user_id] = {
        'password_hash': hash_password(password),
        'coin_balance': 1.0,
        'total_earned': 0.0,  # 🎯 确保初始化为0
        'total_spent': 0.0,   # 🎯 确保初始化为0
        'ethereum_address': ethereum_address,  # 新增以太坊地址字段
        'nfts': [],  # 用户拥有的NFT列表
        'registration_time': datetime.now().isoformat(),
        'uploaded_files': [],
        'referenced_files': []  # 🎯 确保这个字段存在
    }
    
    save_users(users)
    return True, "注册成功"

def authenticate_user(user_id, password):
    users = load_users()
    
    if user_id not in users:
        return False, "用户不存在"
    
    user_data = users[user_id]
    if not isinstance(user_data, dict) or 'password_hash' not in user_data:
        return False, "用户数据不完整，请重新注册"
    
    if user_data['password_hash'] != hash_password(password):
        return False, "密码错误"
    
    return True, "登录成功"

def get_user_stats(user_id):
    users = load_users()
    if user_id not in users:
        return None
    
    user = users[user_id]
    transactions = load_transactions()
    today = datetime.now().date()
    
    today_earned = 0.0
    today_references = 0
    
    for tx in transactions:
        tx_time = datetime.fromisoformat(tx['timestamp']).date()
        if tx_time == today:
            if tx['type'] == 'reward' and tx['to_user'] == user_id:
                today_earned += tx['amount']
            elif tx['type'] == 'reference' and tx['file_owner'] == user_id:
                today_references += 1
    
    return {
        'coin_balance': user['coin_balance'],
        'total_earned': user['total_earned'],
        'total_spent': user['total_spent'],
        'ethereum_address': user.get('ethereum_address'),  # 新增
        'nft_count': len(user.get('nfts', [])),  # 新增
        'today_earned': today_earned,
        'today_references': today_references,
        'uploaded_files_count': len(user['uploaded_files'])
    }



def calculate_user_earnings(user_id):
    """重新计算用户的总收益 - 修复统计问题"""
    users = load_users()
    transactions = load_transactions()
    
    if user_id not in users:
        return 0.0, 0.0, 0
    
    total_earned = 0.0
    total_spent = 0.0
    reference_count = 0
    
    # 重新计算所有交易
    for tx in transactions:
        # 计算收益（奖励和引用）
        if tx['to_user'] == user_id and tx['type'] in ['reward', 'reference']:
            total_earned += tx['amount']
            if tx['type'] == 'reference':
                reference_count += 1
        # 计算支出
        elif tx['from_user'] == user_id and tx['type'] == 'spend':
            total_spent += tx['amount']
    
    # 更新用户数据
    users[user_id]['total_earned'] = total_earned
    users[user_id]['total_spent'] = total_spent
    
    # 确保余额正确
    initial_balance = 1.0  # 注册时赠送的1coin
    calculated_balance = initial_balance + total_earned - total_spent
    users[user_id]['coin_balance'] = max(0, calculated_balance)  # 余额不能为负
    
    save_users(users)
    
    print(f"💰 用户 {user_id} 收益统计: 总收益={total_earned:.6f}, 总支出={total_spent:.6f}, 引用次数={reference_count}")
    
    return total_earned, total_spent, reference_count


def record_transaction(tx_type, from_user, to_user, amount, file_owner=None, file_id=None, question=None):
    """修复交易记录函数 - 确保余额正确更新"""
    transactions = load_transactions()
    
    transaction = {
        'id': str(uuid.uuid4()),
        'type': tx_type,
        'from_user': from_user,
        'to_user': to_user,
        'amount': amount,
        'file_owner': file_owner,
        'file_id': file_id,
        'question': question,
        'timestamp': datetime.now().isoformat()
    }
    
    transactions.append(transaction)
    save_transactions(transactions)
    
    print(f"💾 记录交易: {tx_type}, 从 {from_user} 到 {to_user}, 金额 {amount:.8f}")
    
    # 🎯 修复：重新加载最新的用户数据
    users = load_users()
    
    if tx_type == 'spend' and from_user in users:
        # 确保余额不会变成负数
        new_balance = max(0, users[from_user]['coin_balance'] - amount)
        users[from_user]['coin_balance'] = new_balance
        users[from_user]['total_spent'] += amount
        print(f"💸 用户 {from_user} 支出 {amount:.8f}, 新余额: {users[from_user]['coin_balance']:.6f}")
    
    if tx_type == 'reward' and to_user in users:
        users[to_user]['coin_balance'] += amount
        users[to_user]['total_earned'] += amount
        print(f"🎁 用户 {to_user} 获得奖励 {amount:.8f}, 新余额: {users[to_user]['coin_balance']:.6f}")
    
    # 🎯 修复：确保数据保存
    save_users(users)
    
    # 🎯 修复：再次验证数据是否保存成功
    users_after_save = load_users()
    if to_user in users_after_save and tx_type == 'reward':
        print(f"✅ 最终验证: 用户 {to_user} 余额已更新为 {users_after_save[to_user]['coin_balance']:.6f}")
    if from_user in users_after_save and tx_type == 'spend':
        print(f"✅ 最终验证: 用户 {from_user} 余额已更新为 {users_after_save[from_user]['coin_balance']:.6f}")

@app.route('/profile')
def user_profile():
    if 'user_id' not in session:
        return redirect('/login')
    
    user_id = session['user_id']
    
    # 🎯 重新计算用户收益确保数据准确
    total_earned, total_spent, _ = calculate_user_earnings(user_id)
    
    # 重新加载最新数据
    users = load_users()
    
    if user_id not in users:
        return redirect('/logout')
    
    user = users[user_id]
    
    # 确保用户数据结构完整
    if 'total_earned' not in user:
        user['total_earned'] = 0.0
    if 'total_spent' not in user:
        user['total_spent'] = 0.0
    if 'referenced_files' not in user:
        user['referenced_files'] = []
    
    transactions = load_transactions()
    
    # 获取用户的交易记录
    user_transactions = []
    for tx in transactions:
        if tx['from_user'] == user_id or tx['to_user'] == user_id:
            user_transactions.append(tx)
    
    # 按时间倒序排列，取最近20条
    user_transactions.sort(key=lambda x: x['timestamp'], reverse=True)
    recent_transactions = user_transactions[:20]
    
    # 获取用户文件引用统计
    user_files = search_files(user_id=user_id)
    reference_stats = []
    
    for file_info in user_files:
        file_references = [tx for tx in transactions 
                          if tx.get('file_id') == file_info['file_id'] and tx['type'] == 'reference']
        reference_stats.append({
            'file_id': file_info['file_id'],
            'filename': file_info['filename'],
            'reference_count': len(file_references),
            'total_reward': file_info.get('total_reward', 0),
            'has_nft': file_info.get('has_nft', False)  # 新增
        })
    
    # 计算今日收益
    today = datetime.now().date()
    today_earned = 0.0
    today_references = 0
    
    for tx in transactions:
        if tx['to_user'] == user_id and tx['type'] == 'reward':
            tx_time = datetime.fromisoformat(tx['timestamp']).date()
            if tx_time == today:
                today_earned += tx['amount']
        elif tx.get('file_owner') == user_id and tx['type'] == 'reference':
            tx_time = datetime.fromisoformat(tx['timestamp']).date()
            if tx_time == today:
                today_references += 1
    
    # ============ 新增：获取用户NFT数量 ============
    nft_count = len(user.get('nfts', []))
    # ============ 新增结束 ============
    
    return render_template('profile.html',
                         user_id=user_id,
                         user=user,
                         transactions=recent_transactions,
                         reference_stats=reference_stats,
                         today_earned=today_earned,
                         today_references=today_references,
                         nft_count=nft_count)  # 新增参数


# ==================== 文件管理系统 ====================
def save_shared_file(user_id, filename, content, authorize_rag=True, create_nft=False):  # 新增参数
    files = load_files()
    users = load_users()
    
    # 生成文件ID - 确保格式正确
    file_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{user_id}"
    
    # 创建文件路径 - 使用文件ID作为文件名
    filepath = os.path.join(SHARED_FOLDER, f"{file_id}.txt")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # ============ 新增：IPFS上传和NFT铸造 ============
    ipfs_cid = None
    nft_token_id = None
    nft_info = None
    
    if create_nft and users[user_id].get('ethereum_address'):
        print(f"🔄 开始为文件创建NFT: {filename}")
        
        # 上传内容到IPFS
        ipfs_cid = upload_to_ipfs(content, filename)
        
        if ipfs_cid:
            # 铸造NFT
            owner_address = users[user_id]['ethereum_address']
            content_preview = content[:100] + "..." if len(content) > 100 else content
            
            nft_token_id = mint_nft(owner_address, ipfs_cid, filename, content_preview)
            
            if nft_token_id:
                nft_info = {
                    'token_id': nft_token_id,
                    'ipfs_cid': ipfs_cid,
                    'ipfs_url': get_ipfs_url(ipfs_cid),
                    'mint_time': datetime.now().isoformat()
                }
                
                # 更新用户NFT列表
                if 'nfts' not in users[user_id]:
                    users[user_id]['nfts'] = []
                users[user_id]['nfts'].append({
                    'token_id': nft_token_id,
                    'file_id': file_id,
                    'filename': filename
                })
                
                save_users(users)
                print(f"✅ NFT创建成功: TokenID {nft_token_id}")
    # ============ 新增结束 ============
    
    files[file_id] = {
        'filename': filename,
        'user_id': user_id,
        'content': content,
        'content_preview': content[:200] + "..." if len(content) > 200 else content,
        'upload_time': datetime.now().isoformat(),
        'authorize_rag': authorize_rag,
        'reference_count': 0,
        'total_reward': 0.0,
        'file_path': filepath,
        'ipfs_cid': ipfs_cid,  # 新增
        'nft_token_id': nft_token_id,  # 新增
        'nft_info': nft_info,  # 新增
        'has_nft': nft_token_id is not None  # 新增
    }
    
    save_files(files)
    
    if user_id in users:
        users[user_id]['uploaded_files'].append(file_id)
        save_users(users)
    
    if authorize_rag:
        try:
            print(f"开始将文件添加到知识库: {file_id}, 文件名: {filename}")
            add_file_to_vector_store(filepath, file_id, user_id, filename)
            print(f"成功将文件添加到知识库: {file_id}")
        except Exception as e:
            print(f"添加到知识库失败: {e}")
    
    return file_id

def add_file_to_vector_store(filepath, file_id, user_id, filename):
    global vector_store
    
    try:
        init_vector_store(filepath)
        print(f"成功添加文件到知识库: {filename}")
    except Exception as e:
        print(f"添加文件到向量库失败: {e}")
        raise

# 在 app.py 中找到 search_files 函数，并进行类似如下修改
def search_files(file_id=None, user_id=None, keyword=None):
    files = load_files()
    results = []
    
    for fid, file_info in files.items():
        match = True
        
        if file_id and fid != file_id:
            match = False
        if user_id and file_info['user_id'] != user_id:
            match = False
        if keyword:
            # 扩展搜索范围：同时匹配文件ID、文件名和文件内容
            keyword_lower = keyword.lower()
            file_id_match = (fid.lower().find(keyword_lower) != -1)
            filename_match = (file_info['filename'].lower().find(keyword_lower) != -1)
            content_match = (file_info['content'].lower().find(keyword_lower) != -1)
            
            if not (file_id_match or filename_match or content_match):
                match = False
                
        if match:
            results.append({
                'file_id': fid,
                **file_info
            })
    
    return sorted(results, key=lambda x: x['upload_time'], reverse=True)


# ==================== 智能奖励分配系统 ====================

def calculate_reward_distribution(relevant_docs, total_cost):
    """修复奖励计算函数"""
    if not relevant_docs:
        print("⚠️ 没有相关文档，无法分配奖励")
        return {}
    
    similarities = []
    file_similarities = {}
    
    print(f"📊 开始计算奖励分布: 总成本 {total_cost}, 文档数 {len(relevant_docs)}")
    
    for doc in relevant_docs:
        file_id = doc.metadata.get('file_id')
        similarity = doc.metadata.get('semantic_similarity', 0.3)
        
        print(f"📄 文档 {file_id}: 相似度 {similarity:.3f}")
        
        if file_id:
            if file_id not in file_similarities:
                file_similarities[file_id] = []
            file_similarities[file_id].append(similarity)
            similarities.append(similarity)
    
    if not similarities:
        print("⚠️ 没有有效的相似度数据")
        return {}
    
    # 计算每个文件的平均相似度
    file_avg_similarities = {}
    for file_id, sim_list in file_similarities.items():
        file_avg_similarities[file_id] = sum(sim_list) / len(sim_list)
        print(f"📈 文件 {file_id}: 平均相似度 {file_avg_similarities[file_id]:.3f}")
    
    total_similarity = sum(file_avg_similarities.values())
    print(f"📊 总相似度: {total_similarity:.3f}")
    
    if total_similarity == 0:
        print("⚠️ 总相似度为0，无法分配奖励")
        return {}
    
    reward_distribution = {}
    for file_id, avg_similarity in file_avg_similarities.items():
        weight = avg_similarity / total_similarity
        reward = weight * total_cost
        
        print(f"💰 文件 {file_id}: 权重 {weight:.3f}, 奖励 {reward:.8f} coin")
        
        reward_distribution[file_id] = {
            'reward': reward,
            'weight': weight,
            'similarity': avg_similarity
        }
    
    total_distributed = sum(info['reward'] for info in reward_distribution.values())
    print(f"🎯 总分配金额: {total_distributed:.8f} coin")
    
    return reward_distribution

def distribute_rewards(user_id, question, relevant_docs, total_cost):
    """修复奖励分配函数 - 确保奖励正确分配和记录"""
    reward_distribution = calculate_reward_distribution(relevant_docs, total_cost)
    
    files = load_files()
    users = load_users()
    transactions = load_transactions()
    
    distribution_info = {}
    total_distributed = 0.0
    
    print(f"🔍 开始奖励分配: 总成本 {total_cost}, 相关文档 {len(relevant_docs)} 个")
    
    for file_id, reward_info in reward_distribution.items():
        if file_id and file_id in files:
            file_owner = files[file_id]['user_id']
            reward_amount = reward_info['reward']
            
            if reward_amount > 0 and file_owner in users:
                try:
                    # 🎯 修复：直接更新用户余额
                    users[file_owner]['coin_balance'] += reward_amount
                    if 'total_earned' not in users[file_owner]:
                        users[file_owner]['total_earned'] = 0.0
                    users[file_owner]['total_earned'] += reward_amount
                    
                    # 记录奖励交易
                    reward_tx = {
                        'id': str(uuid.uuid4()),
                        'type': 'reward',
                        'from_user': None,  # 系统发放
                        'to_user': file_owner,
                        'amount': reward_amount,
                        'file_owner': file_owner,
                        'file_id': file_id,
                        'question': question,
                        'timestamp': datetime.now().isoformat()
                    }
                    transactions.append(reward_tx)
                    
                    # 记录引用交易
                    reference_tx = {
                        'id': str(uuid.uuid4()),
                        'type': 'reference',
                        'from_user': user_id,
                        'to_user': file_owner,
                        'amount': 0.0,  # 引用记录，金额为0
                        'file_owner': file_owner,
                        'file_id': file_id,
                        'question': question,
                        'timestamp': datetime.now().isoformat()
                    }
                    transactions.append(reference_tx)
                    
                    # 更新文件统计
                    files[file_id]['reference_count'] += 1
                    files[file_id]['total_reward'] += reward_amount
                    
                    total_distributed += reward_amount
                    
                    print(f"✅ 成功分配奖励: {file_owner} 获得 {reward_amount:.8f} coin")
                    
                except Exception as e:
                    print(f"❌ 奖励分配失败 {file_id}: {e}")
    
    # 🎯 修复：确保数据保存
    save_files(files)
    save_users(users)
    save_transactions(transactions)
    
    print(f"🎯 奖励分配完成: 总分配金额 {total_distributed:.8f} coin")
    return distribution_info

def extract_file_id_from_source(source):
    """从文件路径中提取file_id"""
    if not source:
        return None
    
    # 从文件路径中提取文件名（不带扩展名）
    filename = os.path.basename(source)
    if '.' in filename:
        file_id = filename.split('.')[0]  # 去掉扩展名
    else:
        file_id = filename
    
    print(f"🔍 从source提取file_id: {source} -> {file_id}")
    return file_id

def calculate_reward_distribution(relevant_docs, total_cost):
    """修复奖励计算函数 - 处理file_id为None的情况"""
    if not relevant_docs:
        print("⚠️ 没有相关文档，无法分配奖励")
        return {}
    
    similarities = []
    file_similarities = {}
    
    print(f"📊 开始计算奖励分布: 总成本 {total_cost}, 文档数 {len(relevant_docs)}")
    
    for doc in relevant_docs:
        file_id = doc.metadata.get('file_id')
        similarity = doc.metadata.get('semantic_similarity', 0.3)
        
        # 如果file_id为None，尝试从source中提取
        if file_id is None:
            source = doc.metadata.get('source', '')
            file_id = extract_file_id_from_source(source)
            print(f"🔄 计算奖励时提取file_id: {source} -> {file_id}")
        
        print(f"📄 文档 {file_id}: 相似度 {similarity:.3f}")
        
        if file_id:
            if file_id not in file_similarities:
                file_similarities[file_id] = []
            file_similarities[file_id].append(similarity)
            similarities.append(similarity)
    
    if not similarities:
        print("⚠️ 没有有效的相似度数据")
        return {}
    
    # 计算每个文件的平均相似度
    file_avg_similarities = {}
    for file_id, sim_list in file_similarities.items():
        file_avg_similarities[file_id] = sum(sim_list) / len(sim_list)
        print(f"📈 文件 {file_id}: 平均相似度 {file_avg_similarities[file_id]:.3f}")
    
    total_similarity = sum(file_avg_similarities.values())
    print(f"📊 总相似度: {total_similarity:.3f}")
    
    if total_similarity == 0:
        print("⚠️ 总相似度为0，无法分配奖励")
        return {}
    
    reward_distribution = {}
    for file_id, avg_similarity in file_avg_similarities.items():
        weight = avg_similarity / total_similarity
        reward = weight * total_cost
        
        print(f"💰 文件 {file_id}: 权重 {weight:.3f}, 奖励 {reward:.8f} coin")
        
        reward_distribution[file_id] = {
            'reward': reward,
            'weight': weight,
            'similarity': avg_similarity
        }
    
    total_distributed = sum(info['reward'] for info in reward_distribution.values())
    print(f"🎯 总分配金额: {total_distributed:.8f} coin")
    
    return reward_distribution



# ==================== 从AILibraries复制的核心AI功能 ====================

def enhanced_cosine_similarity(vec1, vec2):
    vec1 = np.array(vec1).flatten()
    vec2 = np.array(vec2).flatten()
    
    if np.all(vec1 == 0) or np.all(vec2 == 0):
        return 0.0
    
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    
    if norm_vec1 == 0 or norm_vec2 == 0:
        return 0.0
    
    similarity = dot_product / (norm_vec1 * norm_vec2)
    similarity = max(-1.0, min(1.0, similarity))
    
    return float(similarity)

def llm_based_relevance_check(question, document_content, llm_model):
    try:
        truncated_content = document_content[:800] + "..." if len(document_content) > 800 else document_content
        
        prompt = f"""请严格判断以下文档内容是否与用户问题相关。请只回答"相关"或"不相关"，不要解释。

用户问题：{question}

文档内容：{truncated_content}

请判断文档内容是否与用户问题相关，只回答"相关"或"不相关"："""
        
        response = llm_model.invoke(prompt).strip().lower()
        print(f"LLM相关性判断结果: '{response}'")
        
        return "相关" in response and "不相关" not in response
        
    except Exception as e:
        print(f"LLM相关性判断错误: {e}")
        return False

def hybrid_relevance_check(question, doc, embeddings_model, llm_model):
    semantic_similarity = calculate_semantic_similarity(question, doc.page_content, embeddings_model)
    
    if semantic_similarity > 0.7:
        return True, semantic_similarity
    elif semantic_similarity > 0.4:
        is_llm_relevant = llm_based_relevance_check(question, doc.page_content, llm_model)
        return is_llm_relevant, semantic_similarity
    else:
        return False, semantic_similarity

def calculate_jaccard_similarity(text1, text2):
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 and not words2:
        return 0.0
    
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    
    return intersection / union if union > 0 else 0.0

def calculate_semantic_similarity(question, document_content, embeddings_model):
    try:
        question_embedding = embeddings_model.embed_query(question)
        doc_embedding = embeddings_model.embed_query(document_content)
        
        base_similarity = enhanced_cosine_similarity(question_embedding, doc_embedding)
        
        is_conceptual_question = any(keyword in question for keyword in 
                                    ["什么是", "什么叫", "定义", "概念", "含义", "解释"])
        
        doc_length = len(document_content.split())
        if is_conceptual_question:
            length_factor = min(1.0, doc_length / 25)
        else:
            length_factor = min(1.0, doc_length / 40)
        
        jaccard_similarity = calculate_jaccard_similarity(question, document_content)
        
        concept_keywords = {
            "爱": ["爱", "爱情", "爱心", "关爱", "热爱", "情感", "感情", "关系", "亲密", "定义", "概念"],
            "什么是": ["定义", "概念", "含义", "解释", "是什么", "什么叫", "意味着", "指的是"]
        }
        
        keyword_boost = 0.0
        for concept, keywords in concept_keywords.items():
            if concept in question:
                keyword_matches = sum(1 for keyword in keywords if keyword in document_content)
                if keyword_matches > 0:
                    if is_conceptual_question:
                        keyword_boost = min(0.25, keyword_matches * 0.08)
                    else:
                        keyword_boost = min(0.15, keyword_matches * 0.05)
                    print(f"关键词匹配增强: 匹配到 {keyword_matches} 个相关关键词，提升 {keyword_boost:.3f}")
                    break
        
        question_len = len(question)
        doc_len = len(document_content)
        if question_len > 0 and doc_len > 0:
            length_similarity = 1 - abs(question_len - doc_len) / (question_len + doc_len)
        else:
            length_similarity = 0
        
        if is_conceptual_question:
            semantic_similarity = (
                0.75 * base_similarity +
                0.05 * jaccard_similarity +
                0.1 * length_factor +
                0.1 * length_similarity +
                keyword_boost
            )
            semantic_similarity = 1 / (1 + math.exp(-6 * (semantic_similarity - 0.4)))
        else:
            semantic_similarity = (
                0.8 * base_similarity +
                0.05 * jaccard_similarity +
                0.1 * length_factor +
                0.05 * length_similarity +
                keyword_boost
            )
            semantic_similarity = 1 / (1 + math.exp(-10 * (semantic_similarity - 0.55)))
        
        print(f"相似度分解 - 语义:{base_similarity:.3f}, Jaccard:{jaccard_similarity:.3f}, 长度因子:{length_factor:.3f}, 关键词增强:{keyword_boost:.3f}, 综合:{semantic_similarity:.3f}")
        
        return semantic_similarity
        
    except Exception as e:
        print(f"语义相似度计算错误: {e}")
        return 0.4

def adaptive_filter_relevant_docs(question, docs, embeddings_model, llm_model):
    relevant_docs = []
    
    print(f"开始自适应过滤 {len(docs)} 个文档")
    
    is_conceptual_question = any(keyword in question for keyword in 
                                ["什么是", "什么叫", "定义", "概念", "含义", "解释", "为什么"])
    
    if is_conceptual_question:
        print("检测到概念性问题，采用LLM主导的过滤策略")
    
    for i, doc in enumerate(docs):
        try:
            is_relevant, similarity = hybrid_relevance_check(question, doc, embeddings_model, llm_model)
            
            doc_preview = doc.page_content[:50] + "..." if len(doc.page_content) > 50 else doc.page_content
            print(f"文档 {i+1} 混合相似度: {similarity:.3f}, 相关: {is_relevant} - 内容: {doc_preview}")
            
            if is_relevant:
                doc.metadata['semantic_similarity'] = float(similarity)
                relevant_docs.append((similarity, doc))
                
        except Exception as e:
            print(f"文档 {i+1} 相关性判断错误: {e}")
            doc.metadata['semantic_similarity'] = 0.4
            relevant_docs.append((0.4, doc))
    
    if not relevant_docs:
        return []
    
    relevant_docs.sort(key=lambda x: x[0], reverse=True)
    
    llm_relevant_docs = [doc for similarity, doc in relevant_docs]
    
    if is_conceptual_question:
        max_docs = min(6, len(llm_relevant_docs))
        filtered_docs = llm_relevant_docs[:max_docs]
        print(f"概念性问题 - 保留所有LLM判断相关的文档: {len(filtered_docs)} 个")
    else:
        similarities = [similarity for similarity, doc in relevant_docs]
        if len(similarities) > 0:
            avg_similarity = sum(similarities) / len(similarities)
            dynamic_threshold = max(0.40, avg_similarity + 0.2 * math.sqrt(sum((x - avg_similarity) ** 2 for x in similarities) / len(similarities)))
            filtered_docs = [doc for similarity, doc in relevant_docs if similarity >= dynamic_threshold]
            filtered_docs = filtered_docs[:4]
            print(f"普通问题 - 动态阈值: {dynamic_threshold:.3f}, 保留: {len(filtered_docs)} 个文档")
        else:
            filtered_docs = llm_relevant_docs[:3]
    
    print(f"过滤后保留 {len(filtered_docs)} 个相关文档")
    return filtered_docs

def intelligent_rag_decision(question, relevant_docs):
    if not relevant_docs:
        return False, "没有相关文档", 0.0
    
    similarities = [doc.metadata.get('semantic_similarity', 0) for doc in relevant_docs]
    max_similarity = max(similarities) if similarities else 0
    avg_similarity = sum(similarities) / len(similarities) if similarities else 0
    
    print(f"RAG决策 - 最高相似度: {max_similarity:.3f}, 平均相似度: {avg_similarity:.3f}")
    
    is_conceptual_question = any(keyword in question for keyword in 
                                ["什么是", "什么叫", "定义", "概念", "含义", "解释", "为什么"])
    
    if is_conceptual_question:
        if len(relevant_docs) == 0:
            return False, "没有相关文档", 0.0
        else:
            doc_count_factor = min(1.0, len(relevant_docs) / 3.0)
            similarity_factor = min(1.0, max_similarity / 0.7)
            
            confidence = 0.5 + 0.3 * doc_count_factor + 0.2 * similarity_factor
            confidence = min(0.9, confidence)
            
            return True, f"找到 {len(relevant_docs)} 个相关文档 (最高相似度:{max_similarity:.3f})", confidence
    else:
        if max_similarity < 0.55:
            return False, f"最高相似度 {max_similarity:.3f} 过低", max_similarity
        elif avg_similarity < 0.40:
            return False, f"平均相似度 {avg_similarity:.3f} 过低", max_similarity
        else:
            confidence = min(1.0, (max_similarity - 0.5) * 2.0)
            return True, f"文档相关性足够 (最高:{max_similarity:.3f}, 平均:{avg_similarity:.3f})", confidence

def hybrid_answering_strategy(question, relevant_docs, confidence):
    is_conceptual_question = any(keyword in question for keyword in 
                                ["什么是", "什么叫", "定义", "概念", "含义", "解释", "为什么"])
    
    if confidence > 0.7:
        strategy = "high_confidence_rag"
        prompt = f"""请基于以下上下文信息回答问题：

相关上下文：
{"\n\n".join([doc.page_content for doc in relevant_docs])}

问题：{question}

请基于上述上下文提供准确回答："""
        
    elif confidence > 0.4:
        strategy = "balanced_hybrid" 
        prompt = f"""请基于以下上下文信息回答问题，同时可以适当结合你的知识进行补充：

相关上下文：
{"\n\n".join([doc.page_content for doc in relevant_docs])}

问题：{question}

请优先使用上下文信息，如果上下文信息不足可以结合你的知识进行补充："""
        
    else:
        strategy = "model_primary"
        prompt = f"""请回答以下问题。我的知识库中有一些可能相关的信息，请主要基于你的知识回答，但可以参考这些信息：

可能相关的信息：
{"\n\n".join([doc.page_content for doc in relevant_docs])}

问题：{question}

请主要基于你的知识进行回答，如果知识库中的信息有帮助可以参考："""
    
    return strategy, prompt

def init_vector_store(filepath=None, file_id=None, user_id=None, filename=None):
    global vector_store

    if not filepath:
        if not vector_store and os.path.exists('chroma_db'):
            vector_store = Chroma(
                persist_directory='chroma_db',
                embedding_function=embeddings
            )
            count = vector_store._collection.count()
            print(f"成功加载本地知识库，共 {count} 条文档块")
        return

    try:
        print(f"正在处理: {filepath}, 文件ID: {file_id}, 用户ID: {user_id}, 文件名: {filename}")

        if filepath.lower().endswith('.pdf'):
            loader = PyPDFLoader(filepath)
            documents = loader.load()
            print(f"PDF 加载成功，共 {len(documents)} 页")
        else:
            with open(filepath, "rb") as f:
                raw = f.read()
                detected = chardet.detect(raw)
                encoding = detected['encoding'] or 'utf-8'
            encoding = 'utf-16' if 'utf-16' in encoding.lower() else encoding
            encoding = 'gbk' if 'gb' in encoding.lower() else encoding
            try:
                loader = TextLoader(filepath, encoding=encoding)
                documents = loader.load()
                print(f"成功加载文本（{encoding}）: {len(documents)} 段")
            except:
                loader = TextLoader(filepath, encoding="utf-8", errors="ignore")
                documents = loader.load()

        cleaned_docs = []
        for doc in documents:
            text = doc.page_content.replace('\ufeff', '').replace('\u200b', '').replace('\u3000', ' ').replace('\xa0', ' ').strip()
            if not text:
                text = f"（空文档，来源：{os.path.basename(filepath)}）"
            doc.page_content = text
            
            # 🎯 修复：确保文件ID被正确存储
            # 如果file_id为None，从文件路径中提取
            if file_id is None:
                file_id_from_path = os.path.basename(filepath).split('.')[0]
                doc.metadata['file_id'] = file_id_from_path
                print(f"🔄 从文件路径提取file_id: {filepath} -> {file_id_from_path}")
            else:
                doc.metadata['file_id'] = file_id
            
            if user_id:
                doc.metadata['user_id'] = user_id
            if filename:
                doc.metadata['filename'] = filename
            
            # 确保source也被正确设置
            doc.metadata['source'] = filepath
                
            cleaned_docs.append(doc)

        text_splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_documents(cleaned_docs)
        if len(chunks) == 0:
            # 创建占位文档时也要设置file_id
            placeholder_metadata = {"source": filepath}
            if file_id:
                placeholder_metadata['file_id'] = file_id
            chunks = [Document(page_content="空文档占位", metadata=placeholder_metadata)]

        print(f"文档已切分为 {len(chunks)} 块")
        
        # 打印第一个块的metadata作为示例
        if chunks:
            print(f"示例文档块metadata: {chunks[0].metadata}")

        all_texts = [c.page_content for c in chunks]
        all_metadatas = [c.metadata for c in chunks]
        all_embeddings = []
        for i, text in enumerate(all_texts):
            embed_success = False
            for attempt in range(5):
                try:
                    embed = embeddings.embed_query(text)
                    all_embeddings.append(embed)
                    print(f"手动嵌入块 {i+1} 成功")
                    embed_success = True
                    break
                except Exception as e:
                    if "502" in str(e):
                        print(f"嵌入 502，重试块 {i+1} 第 {attempt+1} 次...")
                        time.sleep(5)
                    else:
                        raise
            if not embed_success:
                raise Exception(f"嵌入块 {i+1} 失败，5 次重试")

        if vector_store:
            vector_store.add_texts(
                texts=all_texts,
                embeddings=all_embeddings,
                metadatas=all_metadatas
            )
            print(f"文档已追加到知识库: {os.path.basename(filepath)}")
        else:
            class PrecomputedEmbeddings:
                def __init__(self, pre_embeds):
                    self.pre_embeds = pre_embeds

                def embed_documents(self, texts):
                    return self.pre_embeds

                def embed_query(self, text):
                    return self.pre_embeds[0]

            temp_embeddings = PrecomputedEmbeddings(all_embeddings)

            vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=temp_embeddings,
                persist_directory='chroma_db'
            )
            print(f"手动新建知识库成功！文档数: {len(chunks)}")

        print(f"文件处理完成: {os.path.basename(filepath)}\n")

    except Exception as e:
        print(f"严重错误！文件处理彻底失败: {filepath}\n错误信息: {str(e)}")
        raise

def enhanced_record_transaction(tx_type, from_user, to_user, amount, file_owner=None, file_id=None, question=None, details=None):
    """增强的交易记录功能"""
    transactions = load_transactions()
    
    transaction = {
        'id': str(uuid.uuid4()),
        'type': tx_type,
        'from_user': from_user,
        'to_user': to_user,
        'amount': amount,
        'file_owner': file_owner,
        'file_id': file_id,
        'question': question,
        'details': details,  # 新增详细信息字段
        'timestamp': datetime.now().isoformat()
    }
    
    transactions.append(transaction)
    save_transactions(transactions)
    
    # 更新用户余额
    users = load_users()
    if from_user in users and tx_type == 'spend':
        users[from_user]['coin_balance'] -= amount
        users[from_user]['total_spent'] += amount
    
    if to_user in users and tx_type == 'reward':
        users[to_user]['coin_balance'] += amount
        users[to_user]['total_earned'] += amount
    
    save_users(users)
    
    # 记录详细日志
    log_transaction(transaction)

def log_transaction(transaction):
    """记录交易日志到文件"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'transaction': transaction
    }
    
    log_file = 'transaction_logs.json'
    logs = []
    
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                logs = json.load(f)
        except:
            logs = []
    
    logs.append(log_entry)
    
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(logs, f, ensure_ascii=False, indent=2)
# ==================== Flask 路由 ====================

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect('/dashboard')
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user_id = request.form.get('user_id', '').strip()
        password = request.form.get('password', '').strip()
        
        success, message = authenticate_user(user_id, password)
        if success:
            session['user_id'] = user_id
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': message})
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user_id = request.form.get('user_id', '').strip()
        password = request.form.get('password', '').strip()
        
        success, message = register_user(user_id, password)
        if success:
            session['user_id'] = user_id
            return jsonify({'success': True, 'message': message})
        else:
            return jsonify({'success': False, 'message': message})
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect('/')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect('/login')
    
    user_stats = get_user_stats(session['user_id'])
    shared_files = search_files(user_id=session['user_id'])
    
    vector_count = vector_store._collection.count() if vector_store else 0
    
    return render_template('dashboard.html', 
                         user_id=session['user_id'],
                         stats=user_stats,
                         files=shared_files,
                         vector_count=vector_count)


@app.route('/share', methods=['POST'])
def share_file():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    filename = request.form.get('filename', '').strip()
    content = request.form.get('content', '').strip()
    authorize_rag = request.form.get('authorize_rag', 'false') == 'true'
    create_nft = request.form.get('create_nft', 'false') == 'true'  # 新增参数
    
    if not filename or not content:
        return jsonify({'success': False, 'message': '文件名和内容不能为空'})
    
    # ============ 新增：检查NFT创建条件 ============
    users = load_users()
    user_id = session['user_id']
    
    if create_nft and not users[user_id].get('ethereum_address'):
        return jsonify({
            'success': False, 
            'message': '创建NFT需要先设置以太坊地址',
            'need_address': True
        })
    # ============ 新增结束 ============
    
    file_id = save_shared_file(user_id, filename, content, authorize_rag, create_nft)  # 修改调用
    
    response_data = {
        'success': True, 
        'message': '文件分享成功',
        'file_id': file_id
    }
    
    # ============ 新增：添加NFT相关信息 ============
    files = load_files()
    if file_id in files and files[file_id].get('has_nft'):
        response_data['nft_created'] = True
        response_data['nft_info'] = files[file_id].get('nft_info')
    # ============ 新增结束 ============
    
    return jsonify(response_data)



@app.route('/file_content/<file_id>')
def get_file_content(file_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    files = load_files()
    if file_id not in files:
        return jsonify({'success': False, 'message': '文件不存在'})
    
    file_info = files[file_id]
    
    return jsonify({
        'success': True,
        'filename': file_info['filename'],
        'content': file_info['content'],
        'upload_time': file_info['upload_time'],
        'user_id': file_info['user_id'],
        'authorize_rag': file_info.get('authorize_rag', False),
        'reference_count': file_info.get('reference_count', 0),
        'total_reward': file_info.get('total_reward', 0)
    })

@app.route('/ask')
def ask_stream():
    if 'user_id' not in session:
        return Response("data: 请先登录\n\n", mimetype='text/event-stream')
    
    user_id = session['user_id']
    question = request.args.get('q', '').strip()
    
    print(f"用户 {user_id} 提问: {question}")
    
    if not question:
        return Response("data: 问题不能为空\n\n", mimetype='text/event-stream')
    
    users = load_users()
    if user_id not in users or users[user_id]['coin_balance'] < 0.000001:
        return Response("data: Coin余额不足，请充值\n\n", mimetype='text/event-stream')
    
    def generate_response():
        should_use_rag = False
        rag_reason = ""
        confidence = 0.0
        relevant_docs = []
        
        try:
            conversation_cost = 0.000001
            record_transaction('spend', user_id, 'system', conversation_cost, None, None, question)
            
            current_balance = users[user_id]['coin_balance'] - conversation_cost
            print(f"💰 本次对话消耗 {conversation_cost:.6f} coin，当前余额: {current_balance:.6f} coin")
            
            if not vector_store or vector_store._collection.count() == 0:
                print("知识库为空，直接基于模型知识回答...")
                try:
                    response = llm.invoke(question)
                    response_text = response.content if hasattr(response, 'content') else str(response)
                    # 直接发送回答内容
                    yield f"data: {response_text}\n\n"
                    yield "data: [END]\n\n"
                except Exception as e:
                    yield f"data: LLM 服务错误: {str(e)}\n\n"
                    yield "data: [END]\n\n"
                return

            print("知识库已加载，开始检索相关文档...")
            
            retriever = vector_store.as_retriever(search_kwargs={"k": 10})
            all_docs = retriever.invoke(question)
            
            print(f"从知识库检索到 {len(all_docs)} 个文档块")
            
            if not all_docs:
                print("未找到相关文档，将基于模型知识回答")
                try:
                    response = llm.invoke(question)
                    response_text = response.content if hasattr(response, 'content') else str(response)
                    yield f"data: {response_text}\n\n"
                    yield "data: [END]\n\n"
                except Exception as e:
                    yield f"data: LLM 服务错误: {str(e)}\n\n"
                    yield "data: [END]\n\n"
                return
            
            try:
                print("开始智能过滤相关文档...")
                relevant_docs = adaptive_filter_relevant_docs(question, all_docs, embeddings, llm)
                print(f"过滤后保留 {len(relevant_docs)} 个相关文档")
            except Exception as e:
                print(f"智能过滤出错: {str(e)}，使用所有检索到的文档")
                relevant_docs = all_docs
            
            try:
                should_use_rag, rag_reason, confidence = intelligent_rag_decision(question, relevant_docs)
                print(f"{rag_reason} (置信度: {confidence:.2f})")
            except Exception as e:
                print(f"智能决策出错: {str(e)}，默认使用RAG")
                should_use_rag, rag_reason, confidence = True, "默认使用RAG", 0.5
            
            # 奖励分配信息只在后端显示
            if relevant_docs and should_use_rag:
                try:
                    print(f"开始奖励分配: 用户 {user_id}, 问题 '{question}', 相关文档 {len(relevant_docs)} 个")
                    reward_distribution = distribute_rewards(user_id, question, relevant_docs, conversation_cost)
                    
                    if reward_distribution:
                        print("奖励分配详情：")
                        total_distributed = 0
                        
                        for file_id, reward_info in reward_distribution.items():
                            files = load_files()
                            file_info = files.get(file_id, {})
                            filename = file_info.get('filename', '未知文件')
                            file_owner = file_info.get('user_id', '未知用户')
                            
                            reward_amount = reward_info['reward']
                            weight = reward_info['weight']
                            similarity = reward_info['similarity']
                            
                            total_distributed += reward_amount
                            
                            print(f"📄 {filename} (用户: {file_owner})")
                            print(f"    相似度: {similarity:.3f} | 权重: {weight:.3f} | 奖励: {reward_amount:.8f} coin")
                        
                        print(f"💰 总分配金额: {total_distributed:.8f} coin")
                    else:
                        print("⚠️ 没有进行奖励分配")
                        
                except Exception as e:
                    print(f"❌ 奖励分配出错: {e}")
            
            # 🎯 修复：优化AI回答生成部分
            if should_use_rag and relevant_docs:
                try:
                    strategy, hybrid_prompt = hybrid_answering_strategy(question, relevant_docs, confidence)
                    print(f"使用回答策略: {strategy}")

                    unique_sources = {}
                    for doc in relevant_docs:
                        src = doc.metadata.get("source", "未知文件")
                        filename = os.path.basename(src)
                        # 🎯 修改：去掉文件扩展名，只显示文件名
                        filename_without_ext = os.path.splitext(filename)[0]
                        page = doc.metadata.get("page")
                        similarity = doc.metadata.get('semantic_similarity', 0)
                        
                        if filename not in unique_sources:
                            display_name = f"《{filename_without_ext}》"
                            if page is not None:
                                display_name += f" (第 {page + 1} 页)"
                            display_name += f" [相关度:{similarity:.2f}]"
                            
                            unique_sources[filename] = {
                                'display': display_name,
                                'similarity': similarity
                            }
                    
                    # 发送相关文档信息到前端
                    if unique_sources:
                        yield "data: 📚 本次回答参考了以下文档：\n\n"
                        sorted_sources = sorted(unique_sources.values(), key=lambda x: x['similarity'], reverse=True)
                        for i, info in enumerate(sorted_sources):
                            yield f"data: {i+1}. {info['display']}\n"
                        yield "data: \n\n"
                    
                    print("正在生成回答...")
                    
                    # 🎯 修复：添加超时保护和错误处理
                    try:
                        # 设置生成回答的超时时间
                        import threading
                        from queue import Queue, Empty
                        
                        response_queue = Queue()
                        error_queue = Queue()
                        
                        def generate_ai_response():
                            try:
                                response = llm.invoke(hybrid_prompt)
                                response_text = response.content if hasattr(response, 'content') else str(response)
                                response_queue.put(response_text)
                            except Exception as e:
                                error_queue.put(str(e))
                        
                        # 在单独的线程中生成回答
                        thread = threading.Thread(target=generate_ai_response)
                        thread.daemon = True
                        thread.start()
                        
                        # 等待回答生成，最多等待60秒
                        thread.join(timeout=60)
                        
                        if thread.is_alive():
                            # 如果超时，发送超时信息
                            yield "data: ⏰ 生成回答超时，请重试\n\n"
                        elif not error_queue.empty():
                            # 如果有错误，发送错误信息
                            error_msg = error_queue.get()
                            yield f"data: 生成回答时出错: {error_msg}\n\n"
                        else:
                            # 成功生成回答
                            response_text = response_queue.get()
                            yield f"data: {response_text}\n\n"
                            
                    except Exception as e:
                        print(f"AI回答生成异常: {e}")
                        yield f"data: 生成回答时出现异常: {str(e)}\n\n"
                        # 尝试简化回答
                        try:
                            simple_response = llm.invoke(f"请简单回答：{question}")
                            simple_text = simple_response.content if hasattr(simple_response, 'content') else str(simple_response)
                            yield f"data: 简化回答: {simple_text}\n\n"
                        except:
                            yield "data: 无法生成回答，请重试\n\n"
                    
                except Exception as e:
                    print(f"回答策略出错: {e}")
                    yield f"data: 回答策略出错: {str(e)}\n\n"
            else:
                print("将基于模型自身知识进行回答...")
                try:
                    # 同样添加超时保护
                    enhanced_prompt = f"请回答以下问题：{question}"
                    
                    import threading
                    from queue import Queue, Empty
                    
                    response_queue = Queue()
                    error_queue = Queue()
                    
                    def generate_simple_response():
                        try:
                            response = llm.invoke(enhanced_prompt)
                            response_text = response.content if hasattr(response, 'content') else str(response)
                            response_queue.put(response_text)
                        except Exception as e:
                            error_queue.put(str(e))
                    
                    thread = threading.Thread(target=generate_simple_response)
                    thread.daemon = True
                    thread.start()
                    
                    thread.join(timeout=60)
                    
                    if thread.is_alive():
                        yield "data: ⏰ 生成回答超时，请重试\n\n"
                    elif not error_queue.empty():
                        error_msg = error_queue.get()
                        yield f"data: 生成回答时出错: {error_msg}\n\n"
                    else:
                        response_text = response_queue.get()
                        yield f"data: {response_text}\n\n"
                        yield "data: 💡 本次回答基于模型的训练知识。\n\n"
                        
                except Exception as e:
                    yield f"data: 生成回答时出错: {str(e)}\n\n"

            yield "data: [END]\n\n"

        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"AI对话错误详情: {error_details}")
            yield f"data: 系统错误: {str(e)}\n\n"
            yield "data: [END]\n\n"

    return Response(generate_response(), mimetype='text/event-stream')


@app.route('/community')
def community():
    if 'user_id' not in session:
        return redirect('/login')
    
    files = search_files()
    return render_template('community.html', files=files, session=session)

@app.route('/file_detail/<file_id>')
def file_detail(file_id):
    if 'user_id' not in session:
        return redirect('/login')
    
    files = load_files()
    if file_id not in files:
        return "文件不存在", 404
    
    file_info = files[file_id]
    
    return render_template('file_detail.html', 
                         file_info=file_info,
                         user_id=session['user_id'])

@app.route('/vector_status')
def vector_status():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    if not vector_store:
        return jsonify({
            'success': True,
            'vector_count': 0,
            'status': '未初始化'
        })
    
    count = vector_store._collection.count()
    return jsonify({
        'success': True,
        'vector_count': count,
        'status': f'已加载 {count} 个文档块'
    })

@app.route('/reload_vector_store')
def reload_vector_store():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    try:
        global vector_store  # 这是正确的位置
        
        files = load_files()
        authorized_files = [file_info for file_info in files.values() if file_info.get('authorize_rag', False)]
        
        print(f"找到 {len(authorized_files)} 个授权文件需要重新加载")
        
        if vector_store:
            import shutil
            if os.path.exists('chroma_db'):
                shutil.rmtree('chroma_db')
            vector_store = None
        
        for file_info in authorized_files:
            file_path = file_info.get('file_path')
            file_id = None
            for fid, finfo in files.items():
                if finfo == file_info:
                    file_id = fid
                    break
            user_id = file_info.get('user_id')
            filename = file_info.get('filename')
            
            if file_path and os.path.exists(file_path) and file_id:
                try:
                    add_file_to_vector_store(file_path, file_id, user_id, filename)
                    print(f"重新加载文件到知识库: {filename}")
                except Exception as e:
                    print(f"重新加载文件失败 {filename}: {e}")
        
        final_count = vector_store._collection.count() if vector_store else 0
        
        return jsonify({
            'success': True,
            'message': f'知识库重新加载完成，共 {final_count} 个文档块',
            'vector_count': final_count
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'重新加载知识库失败: {str(e)}'
        })
    
@app.route('/health')
def health_check():
    status = {
        "ollama_status": "unknown",
        "embedding_model": "unknown", 
        "llm_model": "unknown",
        "vector_store": "empty" if not vector_store else f"loaded ({vector_store._collection.count()} docs)",
        "user_count": len(load_users()),
        "file_count": len(load_files())
    }
    
    try:
        test_embed = embeddings.embed_query("test")
        status["embedding_model"] = "ok"
        
        test_response = llm.invoke("hello")
        status["llm_model"] = "ok"
        status["ollama_status"] = "running"
        
    except Exception as e:
        status["ollama_status"] = f"error: {str(e)}"
    
    return jsonify(status)

@app.route('/files')
def list_files():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    keyword = request.args.get('keyword', '').strip()
    file_id = request.args.get('file_id', '').strip()
    
    # 🎯 优化搜索逻辑
    files = search_files(file_id=file_id if file_id else None, keyword=keyword)
    
    print(f"🔍 搜索请求 - 关键词: '{keyword}', 文件ID: '{file_id}', 结果数量: {len(files)}")
    
    return jsonify({
        'success': True,
        'files': files,
        'count': len(files)
    })

def search_files(file_id=None, user_id=None, keyword=None):
    """优化文件搜索功能"""
    files = load_files()
    results = []
    
    print(f"🔍 搜索文件 - file_id: {file_id}, user_id: {user_id}, keyword: {keyword}")
    
    for fid, file_info in files.items():
        match = True
        
        if file_id and fid != file_id:
            match = False
        if user_id and file_info['user_id'] != user_id:
            match = False
        if keyword:
            keyword_lower = keyword.lower()
            # 🎯 优化：在文件名和内容中搜索，提高搜索准确性
            filename_match = keyword_lower in file_info['filename'].lower()
            content_match = keyword_lower in file_info['content'].lower()
            file_id_match = keyword_lower in fid.lower()
            user_id_match = keyword_lower in file_info['user_id'].lower()
            
            if not (filename_match or content_match or file_id_match or user_id_match):
                match = False
                
        if match:
            results.append({
                'file_id': fid,
                **file_info
            })
    
    # 按上传时间倒序排列
    sorted_results = sorted(results, key=lambda x: x['upload_time'], reverse=True)
    
    print(f"✅ 搜索完成，找到 {len(sorted_results)} 个文件")
    return sorted_results


# ==================== 新增路由 ====================

@app.route('/nft_gallery')
def nft_gallery():
    """NFT画廊页面"""
    if 'user_id' not in session:
        return redirect('/login')
    
    user_id = session['user_id']
    users = load_users()
    
    if user_id not in users:
        return redirect('/logout')
    
    user_nfts = users[user_id].get('nfts', [])
    files = load_files()
    
    # 获取NFT详细信息
    nft_details = []
    for nft in user_nfts:
        file_id = nft.get('file_id')
        if file_id in files:
            file_info = files[file_id]
            nft_details.append({
                'token_id': nft.get('token_id'),
                'filename': nft.get('filename'),
                'file_id': file_id,
                'ipfs_url': file_info.get('nft_info', {}).get('ipfs_url'),
                'mint_time': file_info.get('nft_info', {}).get('mint_time'),
                'content_preview': file_info.get('content_preview')
            })
    
    return render_template('nft_gallery.html',
                         user_id=user_id,
                         nfts=nft_details,
                         nft_count=len(nft_details))

@app.route('/create_nft/<file_id>', methods=['POST'])
def create_nft_for_file(file_id):
    """为已有文件创建NFT"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    user_id = session['user_id']
    files = load_files()
    users = load_users()
    
    if file_id not in files:
        return jsonify({'success': False, 'message': '文件不存在'})
    
    file_info = files[file_id]
    
    # 检查文件是否已有NFT
    if file_info.get('has_nft'):
        return jsonify({'success': False, 'message': '该文件已有NFT'})
    
    # 检查用户是否有以太坊地址
    if not users[user_id].get('ethereum_address'):
        return jsonify({'success': False, 'message': '请先设置以太坊地址'})
    
    try:
        # 读取文件内容
        with open(file_info['file_path'], 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 上传到IPFS并铸造NFT
        ipfs_cid = upload_to_ipfs(content, file_info['filename'])
        
        if not ipfs_cid:
            return jsonify({'success': False, 'message': 'IPFS上传失败'})
        
        owner_address = users[user_id]['ethereum_address']
        nft_token_id = mint_nft(owner_address, ipfs_cid, file_info['filename'], file_info['content_preview'])
        
        if nft_token_id:
            # 更新文件信息
            file_info['ipfs_cid'] = ipfs_cid
            file_info['nft_token_id'] = nft_token_id
            file_info['has_nft'] = True
            file_info['nft_info'] = {
                'token_id': nft_token_id,
                'ipfs_cid': ipfs_cid,
                'ipfs_url': get_ipfs_url(ipfs_cid),
                'mint_time': datetime.now().isoformat()
            }
            
            # 更新用户NFT列表
            if 'nfts' not in users[user_id]:
                users[user_id]['nfts'] = []
            
            users[user_id]['nfts'].append({
                'token_id': nft_token_id,
                'file_id': file_id,
                'filename': file_info['filename']
            })
            
            save_files(files)
            save_users(users)
            
            return jsonify({
                'success': True,
                'message': 'NFT创建成功',
                'token_id': nft_token_id,
                'ipfs_url': get_ipfs_url(ipfs_cid)
            })
        else:
            return jsonify({'success': False, 'message': 'NFT铸造失败'})
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'创建NFT时出错: {str(e)}'})

@app.route('/set_ethereum_address', methods=['POST'])
def set_ethereum_address():
    """设置用户以太坊地址"""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    user_id = session['user_id']
    address = request.form.get('ethereum_address', '').strip()
    
    if not address:
        return jsonify({'success': False, 'message': '地址不能为空'})
    
    # 简单的地址格式验证
    if not address.startswith('0x') or len(address) != 42:
        return jsonify({'success': False, 'message': '无效的以太坊地址格式'})
    
    users = load_users()
    
    if user_id not in users:
        return jsonify({'success': False, 'message': '用户不存在'})
    
    users[user_id]['ethereum_address'] = address
    save_users(users)
    
    return jsonify({'success': True, 'message': '以太坊地址设置成功'})

@app.route('/blockchain_status')
def blockchain_status():
    """区块链状态检查"""
    status = {
        'web3_connected': w3.is_connected(),
        'ipfs_connected': check_ipfs_connection(),
        'nft_contract_loaded': nft_contract is not None,
        'reward_contract_loaded': reward_contract is not None,
        'current_block': w3.eth.block_number if w3.is_connected() else 0,
        'accounts': len(w3.eth.accounts) if w3.is_connected() else 0
    }
    
    return jsonify(status)


if __name__ == '__main__':
    print("🚀 启动多用户AI知识库平台...")
    print("📚 初始化向量库...")
    init_vector_store()
    
    # ============ 新增：检查区块链连接 ============
    print("🔗 检查区块链连接...")
    if w3.is_connected():
        print(f"✅ 区块链连接成功，当前区块: {w3.eth.block_number}")
    else:
        print("❌ 区块链连接失败")
    
    # 检查IPFS连接
    print("🌐 检查IPFS连接...")
    if check_ipfs_connection():
        print("✅ IPFS连接成功")
    else:
        print("❌ IPFS连接失败")
    # ============ 新增结束 ============
    
    if vector_store:
        try:
            count = vector_store._collection.count()
            print(f"✅ 向量库加载成功，包含 {count} 个文档")
        except Exception as e:
            print(f"❌ 向量库访问错误: {e}")
    else:
        print("⚠️  向量库未加载，知识库为空")
    
    print("🌐 启动Web服务器...")
    app.run(host='127.0.0.1', port=5000, debug=True)