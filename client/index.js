/* global module: true */
import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import VAPID from './../private/vapid.json';


import 'file-loader?name=./img/launcher-icon-1x.png!./img/launcher-icon-1x.png';
import 'file-loader?name=./img/launcher-icon-2x.png!./img/launcher-icon-2x.png';
import 'file-loader?name=./img/launcher-icon-4x.png!./img/launcher-icon-4x.png';
import 'file-loader?name=./apple-touch-icon-57x57.png!./img/apple-touch-icon-57x57.png';
import 'file-loader?name=./apple-touch-icon-60x60.png!./img/apple-touch-icon-60x60.png';
import 'file-loader?name=./apple-touch-icon-72x72.png!./img/apple-touch-icon-72x72.png';
import 'file-loader?name=./apple-touch-icon-76x76.png!./img/apple-touch-icon-76x76.png';
import 'file-loader?name=./apple-touch-icon-114x114.png!./img/apple-touch-icon-114x114.png';
import 'file-loader?name=./apple-touch-icon-120x120.png!./img/apple-touch-icon-120x120.png';
import 'file-loader?name=./apple-touch-icon-144x144.png!./img/apple-touch-icon-144x144.png';
import 'file-loader?name=./apple-touch-icosn-152x152.png!./img/apple-touch-icon-152x152.png';

// Web Application Manifest
// https://developer.mozilla.org/en-US/docs/Web/Manifest
import 'file-loader?name=./web-app-manifest.json!./web-app-manifest.json';
import 'file-loader?name=./apple-touch-icon-180x180.png!./img/apple-touch-icon-180x180.png';

import 'worker-loader?name=./serviceWorker.js!./serviceWorker.js';

// Service Worker registion
if ( 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('serviceWorker.js')
    .then(reg => {
      console.log(`Service Worker is registered: ${reg}`);
    })
    .catch(err => {
      console.log(`Error occured while registering Service worker: ${err}`);
    });
} else {
  console.log('Could not register service worker as it isnt supported');
}

ReactDOM.render((<App />), document.getElementById('root'));

if (module.hot) {
  module.hot.accept(function () {
    console.log('Accepting the updated printMe module!');
  });
}