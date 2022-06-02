const baseUrl = '';

const API = {
    request: async (method, endpoint, data = undefined) => {
        let dataObj = {
            method: method,
            headers: {
                'content-type': 'Application/json',
                'accpect': 'Application/json'
            }
        }
        let queryParams = '?'
        let url
        if (method == 'GET' && data) {
            for (const key in data) {
                queryParams += `${key}=${data[key]}&`
            }
            url = baseUrl + endpoint + queryParams
        }
        else {
            if(data) dataObj['data'] = data
            url = baseUrl + endpoint
        }
        try {
            const res = await fetch(url,dataObj)
            return await res.json()
        }
        catch(err){
            return err
        }
    }
}