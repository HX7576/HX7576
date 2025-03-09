from flask import Flask, jsonify
from requests_html import HTMLSession

app = Flask(__name__)

def get_pdd_products():
    try:
        url = "https://mobile.yangkeduo.com"  # 改用移动端页面
        headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': 'https://mobile.yangkeduo.com/'
        }
        
        # 使用HTMLSession支持JavaScript渲染
        session = HTMLSession()
        response = session.get(url, headers=headers, timeout=30)
        
        # 渲染JavaScript（最多等待10秒）
        response.html.render(timeout=10, sleep=5)
        # 检查响应状态码
        if response.status_code != 200:
            return {'success': False, 'error': f'HTTP {response.status_code}'}
            
        # 检查是否被重定向到验证码页面
        if 'captcha' in response.url:
            return {'success': False, 'error': 'Captcha required'}
            
        # 移除BeautifulSoup改用requests-html完整解析
        products = []
        # 添加详细日志输出
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容长度: {len(response.text)}")
        
        # 更新为移动端实际选择器
        product_items = response.html.find('.item-wrap')
        
        for item in product_items:
            try:
                product = {
                    'name': item.find('.goods-name', first=True).text.strip(),
                    'price': item.find('.price', first=True).text.strip(),
                    'image': item.find('img', first=True).attrs['src']
                }
                # 处理图片相对路径
                if not product['image'].startswith('http'):
                    product['image'] = f'https:{product["image"]}'
                products.append(product)
            except Exception as e:
                continue
            
        return {'success': True, 'products': products}
        
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/api/products')
def products():
    data = get_pdd_products()
    return jsonify(data)

if __name__ == '__main__':
    try:
        import socket
        socket.getfqdn = lambda x: 'localhost'
        app.run(host='127.0.0.1', port=5000, debug=True)
    except Exception as e:
        print(f"Failed to start server: {e}")
