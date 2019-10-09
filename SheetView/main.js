import React, { Component } from "react";

// https://www.valentinog.com/blog/babel/
document.getElementById("text").innerText = "HALLO";

window.addEventListener('message', event => {

    const message = event.data; // The JSON data our extension sent
    document.getElementById("text").innerText = message.sheetTime;
});