import axios from 'axios';

const PINATA_API_KEY = "fbe13b5c7369c92b693b"; // 替换为你的Pinata API Key
const PINATA_SECRET_KEY = "xxx";

// 上传文件到IPFS
export const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_KEY,
      },
    }
  );
  return `ipfs://${res.data.IpfsHash}`;
};
