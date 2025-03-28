import os
import sys
import uuid
import zipfile
import urllib3
import requests

# Disable SSL warnings (only use this for testing purposes)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# NVAI endpoint for the ocdrnet NIM
nvai_url="https://ai.api.nvidia.com/v1/cv/nvidia/ocdrnet"

header_auth = "Bearer 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"

def _upload_asset(input, description):
    """
    Uploads an asset to the NVCF API.
    :param input: The binary asset to upload
    :param description: A description of the asset
    """
    assets_url = "https://api.nvcf.nvidia.com/v2/nvcf/assets"

    headers = {
        "Authorization": header_auth,
        "Content-Type": "application/json",
        "accept": "application/json",
    }

    s3_headers = {
        "x-amz-meta-nvcf-asset-description": description,
        "content-type": "image/jpeg",
    }

    payload = {"contentType": "image/jpeg", "description": description}

    response = requests.post(assets_url, headers=headers, json=payload, timeout=30, verify=False)
    response.raise_for_status()

    asset_url = response.json()["uploadUrl"]
    asset_id = response.json()["assetId"]

    response = requests.put(
        asset_url,
        data=input,
        headers=s3_headers,
        timeout=300,
        verify=False
    )

    response.raise_for_status()
    return uuid.UUID(asset_id)


if __name__ == "__main__":
    """Uploads an image of your choosing to the NVCF API and sends a
    request to the Optical character detection and recognition model.
    The response is saved to a local directory.

    Note: You must set up an environment variable, NGC_PERSONAL_API_KEY.
    """

    if len(sys.argv) != 3:
        print("Usage: python test.py <image> <output_dir>")
        sys.exit(1)

    try:
        asset_id = _upload_asset(open(sys.argv[1], "rb"), "Input Image")

        inputs = {"image": f"{asset_id}", "render_label": False}

        asset_list = f"{asset_id}"

        headers = {
            "Content-Type": "application/json",
            "NVCF-INPUT-ASSET-REFERENCES": asset_list,
            "NVCF-FUNCTION-ASSET-IDS": asset_list,
            "Authorization": header_auth,
        }

        response = requests.post(nvai_url, headers=headers, json=inputs, verify=False)
        response.raise_for_status()

        os.makedirs(sys.argv[2], exist_ok=True)
        with open(f"{sys.argv[2]}.zip", "wb") as out:
            out.write(response.content)

        with zipfile.ZipFile(f"{sys.argv[2]}.zip", "r") as z:
            z.extractall(sys.argv[2])

        print(f"Output saved to {sys.argv[2]}")
        print(os.listdir(sys.argv[2]))
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        sys.exit(1)


    