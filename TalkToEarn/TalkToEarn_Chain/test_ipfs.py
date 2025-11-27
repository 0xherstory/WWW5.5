# test_ipfs_requests.py
# 适用于 Windows / macOS / Linux，直接用 requests 调用最新版 IPFS Desktop


import os
os.environ["PYTHONUTF8"] = "1"    # 这行搞定一切乱码！

import requests
import json
from urllib3.util import Retry
from requests.adapters import HTTPAdapter


# ==================== 配置区 ====================
IPFS_API = "http://127.0.0.1:5001/api/v0"   # IPFS Desktop 默认 API 地址
GATEWAY = "http://127.0.0.1:8080"           # IPFS Desktop 默认网关地址
TIMEOUT = 10                                # 超时秒数
# ================================================

# 创建一个带重试的 session（更稳定）
session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[502, 503, 504])
session.mount("http://", HTTPAdapter(max_retries=retries))

def check_port_open():
    """检查 5001 端口是否在监听"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(2)
    result = sock.connect_ex(('127.0.0.1', 5001))
    sock.close()
    return result == 0

def call_ipfs(command, files=None, data=None, params=None):
    """统一调用 IPFS HTTP API"""
    url = f"{IPFS_API}/{command}"
    try:
        response = session.post(
            url,
            files=files,
            data=data,
            params=params,
            timeout=TIMEOUT
        )
        response.raise_for_status()
        return response
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"IPFS API 调用失败: {e}")

def test_ipfs():
    print("=" * 50)
    print("IPFS Desktop 连接测试（requests 版）")
    print("=" * 50)

    # 1. 检查端口
    if not check_port_open():
        print("IPFS Desktop 未运行或端口被占用")
        print("\n请确认：")
        print("   1. IPFS Desktop 已经启动")
        print("   2. 状态栏显示「Connected」或「Running」")
        print("   3. API 端口为 5001（默认没有改过）")
        return

    print("IPFS Daemon 正在运行（5001 端口已监听）")

    try:
        # 2. 获取节点信息
        print("\n正在获取节点信息...")
        resp = call_ipfs("id")
        info = resp.json()
        node_id = info["ID"]
        addresses = info.get("Addresses", [])[:2]  # 只显示前两条
        print(f"连接成功！")
        print(f"   节点 ID : {node_id}")
        print(f"   部分地址 : {addresses}")

        # 3. 测试上传字符串
        print("\n正在测试文件上传...")
        test_content = "Hello from requests! 时间: " + __import__('time').strftime("%Y-%m-%d %H:%M:%S")
        
        # 方法1：上传纯字符串（推荐）
        resp = call_ipfs("add", files={"file": ("test.txt", test_content.encode("utf-8"))})
        
        # 解析返回的 JSON Lines（每行一个 JSON）
        lines = [json.loads(line) for line in resp.text.strip().split("\n") if line]
        hash_result = lines[-1]["Hash"]  # 最后一个才是最终 hash
        
        print(f"上传成功！")
        print(f"   CID     : {hash_result}")
        print(f"   网关访问: {GATEWAY}/ipfs/{hash_result}")
        print(f"   永久链接: https://ipfs.io/ipfs/{hash_result}")

        # 4. 可选：再 pin 一下确保本地保留
        call_ipfs("pin/add", params={"arg": hash_result})
        print(f"已 Pin，文件将永久保留在本地")

        print("\n" + "="*50)
        print("IPFS Desktop 一切正常！")
        print("="*50)

    except Exception as e:
        print(f"测试失败: {e}")
        print("\n常见解决方案：")
        print("   • 确认 IPFS Desktop 已完全启动（状态栏绿点）")
        print("   • 检查是否被防火墙或杀毒软件阻止了 5001 端口")
        print("   • 重启 IPFS Desktop 后再试")

if __name__ == "__main__":
    test_ipfs()