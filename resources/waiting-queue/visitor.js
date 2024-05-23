const token = 'eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtNWNmMmU4YzY2YjdlNDQxMjkxYjczZmRjNWJmNjIxNTIvODBiOGNiLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3MTY0NDU0MDAsImV4cCI6MTgxNjQ1MjYwMCwibmJmIjoxNzE2NDQ1Mzk1LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtNWNmMmU4YzY2YjdlNDQxMjkxYjczZmRjNWJmNjIxNTIiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsIm91dGJvdW5kLWNhbGwiOnRydWUsInNpcC1vdXRib3VuZC1jYWxsIjpmYWxzZSwidHJhbnNjcmlwdGlvbiI6dHJ1ZSwicmVjb3JkaW5nIjp0cnVlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6InRvcmplbHVjaWFuK3dhaXQiLCJpZCI6ImF1dGgwfDY2NGVlMGE0MDcwZWI0ODliYTY4Mjk0YSIsImF2YXRhciI6IiIsImVtYWlsIjoidG9yamVsdWNpYW4rd2FpdEBnbWFpbC5jb20ifX0sInJvb20iOiIqIn0.dnpioYTPnTWJ0S9Ht4pxw-uDP647FGJilLm53nlYcSYh0D9X8OY28x2h2oJGtlD8g_RmsNYQbSXltr8kKd84PLJIkkc5fmao49F-al_7BIB1xxEQylZatnbZNThgsB06tPyRr825yD8bLKDIMH7CGAf3R8qT41MmEWelInN3yhv6-3p7sqIiv-d_9ceW0IY7K-__anD4qN-jcm2pTnRlXWmGUrmBRwHKdM7meRlPJ8xXHE4HWWCQQEug9CtEtG2b1_Vj_8P2Ro6pcRd9zajRlFcHIiDcQEh451ENP_iqSHcgyGLBKzW8z_P1IzGWlYWxB1NeGqJSkSOZ78Jp905iXA'

const stompClient = new StompJs.Client({
    brokerURL: 'ws://localhost:8060/waiting-queue/visitor/websocket',
});

stompClient.onWebSocketError = (error) => {
        console.error('Error with websocket', error);
};

stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message']);
    console.error('Additional details: ' + frame.body);
};

function setConnected(connected) {
    $("#connect").prop("disabled", connected);
    $("#disconnect").prop("disabled", !connected);
    if (connected) {
        $("#conversation").show();
    }
    else {
        $("#conversation").hide();
    }
    $("#messages").html("");
}

function connect(conference) {
    console.log("Connecting to conference " + conference);

    headers = {
        Authorization: 'Bearer ' + token
    };

    stompClient.connectHeaders = headers;

    stompClient.onConnect = (frame) => {
        setConnected(true);
        console.log('Connected: ' + frame);

        stompClient.subscribe('/secured/conference/visitor/topic.' + conference, (message) => {
            showMessage(message.body);
        }, headers);
    };

    stompClient.activate();
}

function disconnect() {
    stompClient.deactivate();
    setConnected(false);
    console.log("Disconnected");
}

function showMessage(message) {
    $("#messages").append("<tr><td>" + message + "</td></tr>");
}

$(function () {
    $("form").on('submit', (e) => e.preventDefault());
    $( "#connect" ).click(() => connect($("#conference").val()));
    $( "#disconnect" ).click(() => disconnect());
});