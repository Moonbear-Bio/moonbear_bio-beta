from app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', ssl_context=('/etc/letsencrypt/live/getmoonbear.com/fullchain.pem', '/etc/letsencrypt/live/getmoonbear.com/privkey.pem'), port=3334)