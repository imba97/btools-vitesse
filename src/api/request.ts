const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
}

export function useRequest(baseUrl: string) {
  const get = async (path: string, data?: any) => {
    const url = new URL(`${baseUrl}${path}`)

    if (data) {
      _forEach(data, (value, key) => {
        url.searchParams.append(key, value)
      })
    }

    return fetch(url, {
      method: 'GET',
      headers: defaultHeaders
    }).then(response => response.json())
  }

  const post = async (path: string, data?: any) => {
    const formData = new FormData()

    if (data) {
      _forEach(data, (value, key) => {
        formData.append(key, value)
      })
    }

    return fetch(`${baseUrl}/${path}`, {
      method: 'POST',
      body: formData,
      headers: defaultHeaders
    }).then(response => response.json())
  }

  return {
    get,
    post
  }
}
