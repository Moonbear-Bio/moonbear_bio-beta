#!/usr/bin/python3
# import flask, requests, JSON
from flask import Flask, jsonify, request
from inference.pathology.pc_chip.pc_chip import PC_CHiP
from inference.genomics.enformer.enformer import Enformer
from inference.proteomics.protTrans.protTrans import ProtTrans

import requests
import json

from flask_cors import CORS

app = Flask(__name__)
CORS(app)
cors = CORS(app, resource={
    r"/*":{
        "origins":"*"
    }
})

app.config['DEBUG'] = True


# decorator to set up API route for GET
@app.route('/', methods=['GET'])
# route for home
def home():
    return "Welcome to Unicorn!"

@app.route('/test', methods=['GET'])
# route for home
def test():
    print('here')
    return jsonify("Welcome to Unicorn!"), 200


# route to take data as parameters, execute ML model, and display results
@app.route('/api/site_image_predict', methods=['GET'])
def predict():
    model = PC_CHiP()
    preds = model.predict('./uploads/images')
    results = [{'filepath':pred[0][9:], 'class': 'Normal Tissue' if 'tumor' not in pred[1][0][0] else 'Diseased Tissue'} for pred in preds]
    print(results)
    return jsonify(results), 200


app.run()