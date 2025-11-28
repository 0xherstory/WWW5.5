const PINATA_JWT = process.env.PINATA_JWT

export async function uploadToIPFS(data: string): Promise<string | null> {
  if (!PINATA_JWT) {
    console.error('Pinata JWT not found')
    return null
  }

  try {
    // Prepare FormData for pinFileToIPFS
    const formData = new FormData()
    const file = new Blob([data], { type: 'application/json' })
    // @ts-ignore
    formData.append('file', file, 'expense.json')

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData as any, // for TS compatibility in node/browser
    })

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.status} ${await response.text()}`)
    }

    const result = await response.json()
    return result.IpfsHash || null
  } catch (error) {
    console.error('IPFS upload failed:', error)
    return null
  }
}

export async function retrieveFromIPFS(cid: string): Promise<string | null> {
  // Pinata uploads to public IPFS gateway, so use a public IPFS gateway to retrieve
  try {
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('IPFS retrieval failed')
    }
    return await response.text()
  } catch (error) {
    console.error('IPFS retrieval failed:', error)
    return null
  }
}
