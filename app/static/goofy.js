document.addEventListener("DOMContentLoaded", loadgoofy);

const goofy_chatbox = document.getElementById("goofy-chatbox-area");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendButton");
const chatArea = document.getElementById("chatArea");

function loadgoofy() {
    const goofy_btn = document.getElementById("goofy-btn");

    goofy_btn.addEventListener("click", async function(event) {
        event.stopPropagation();
        openGoofyChatBox();

        try {
            const res = await fetch("/chat", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({event: "goofy_init"})
            });

            const data = await res.json();
            addMessage(data.reply, "bot");

            if (data.show_qr) {
                addQRMessage(data.whatsapp_link);
            }
        } catch (err) {
            addMessage("Oops 🍷 Goofy had a hiccup. Try again.", "bot");
            console.error(err);
        }
    });

    sendBtn.addEventListener("click", sendMessage);

    goofy_chatbox.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    document.addEventListener("click", function() {
        goofy_chatbox.style.display = "none";
    });
}

function openGoofyChatBox() {
    goofy_chatbox.style.display = "block";
}

input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

async function sendDish() {
    const dish = document.getElementById("dish-input").value.trim();
    const replyDiv = document.getElementById("reply");

    if (!dish) return;

    replyDiv.innerHTML = "Goofy is thinking... 🍷";

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: dish})
        });

        const data = await res.json();
        replyDiv.innerHTML = marked.parse(data.reply || "No response from Goofy.");
    } catch (err) {
        replyDiv.innerHTML = "Oops! Goofy spilled the wine 🍷 Try again!";
        console.error(err);
    }
}

async function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    addMessage("Goofy is thinking... 🍷", "bot");

    try {
        const res = await fetch("/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({message: text})
        });

        const data = await res.json();

        const thinkingMessages = document.querySelectorAll(".bot-message");
        const lastBotMessage = thinkingMessages[thinkingMessages.length - 1];

        if (lastBotMessage) {
            lastBotMessage.innerHTML = marked.parse(data.reply || "No response from Goofy.");
        }

    } catch (err) {
        const thinkingMessages = document.querySelectorAll(".bot-message");
        const lastBotMessage = thinkingMessages[thinkingMessages.length - 1];

        if (lastBotMessage) {
            lastBotMessage.innerHTML = "Oops 🍷 Goofy had trouble connecting to the kitchen.";
        }

        console.error(err);
    }
}

function addMessage(text, type) {
    const msg = document.createElement("div");
    msg.classList.add("message");

    if (type === "user") {
        msg.classList.add("user-message");
    } else {
        msg.classList.add("bot-message");
    }

    msg.innerHTML = marked.parse(text);
    msg.style.opacity = "0";
    msg.style.transform = "translateY(5px)";
    chatArea.appendChild(msg);

    setTimeout(() => {
        msg.style.transition = "0.2s";
        msg.style.opacity = "1";
        msg.style.transform = "translateY(0)";
    }, 10);

    const chat = document.getElementById("chatBody");
    chat.scrollTop = chat.scrollHeight;
}

function addQRMessage(link) {
    const msg = document.createElement("div");
    msg.classList.add("message", "bot-message", "qr-message");

    const label = document.createElement("div");
    label.innerHTML = "📱 <b>Scan to continue on WhatsApp</b>";

    const linkEl = document.createElement("a");
    linkEl.href = link;
    linkEl.target = "_blank";
    linkEl.innerText = "Open WhatsApp";
    linkEl.style.color = "#25D366";
    linkEl.style.fontWeight = "bold";
    linkEl.style.textDecoration = "none";
    linkEl.classList.add("qr-link");

    const qrBox = document.createElement("div");
    qrBox.classList.add("qr-box");

    msg.appendChild(label);
    msg.appendChild(qrBox);
    msg.appendChild(linkEl);

    chatArea.appendChild(msg);

    new QRCode(qrBox, {
        text: link,
        width: 140,
        height: 140
    });

    const chatBody = document.getElementById("chatBody");
    chatBody.scrollTop = chatBody.scrollHeight;
}
