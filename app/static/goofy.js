document.addEventListener("DOMContentLoaded", loadgoofy);

function loadgoofy() {
    const goofy_btn = document.getElementById("goofy-btn");
    
    // click buttons
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
            addMessage(
                "Oops 🍷 I ran into a little hiccup. Try again in a moment.",
                "bot"
            );
            console.error(err);
        }
    });

    sendBtn.addEventListener("click", sendMessage);
    goofy_chatbox.addEventListener("click", function(event) {
        event.stopPropagation();
    });

    document.addEventListener("click", function() {
        goofy_chatbox.style.display = "none"; // anything outside closes it
    });

    function openGoofyChatBox() {
        goofy_chatbox.style.display = "block";
    }
}

const goofy_chatbox = document.getElementById("goofy-chatbox-area");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendButton");
const chatArea = document.getElementById("chatArea");


input.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

async function sendDish() {
    const dish = document.getElementById('dish-input').value.trim();
    if(!dish) return;
    const replyDiv = document.getElementById('reply');
    replyDiv.textContent = 'Goofy is thinking... 🍷';
    try {
        const res = await fetch('/app/bot.py', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({message: dish})
        });
        const data = await res.json();
        replyDiv.textContent = data.reply;
    } catch(err) {
        replyDiv.textContent = 'Oops! Goofy spilled the wine 🍷 Try again!';
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

    // scroll to bottom
    const chat = document.getElementById("chatBody");
    chat.scrollTop = chat.scrollHeight;
}

function addQRMessage(link) {
    const chatArea = document.getElementById("chatArea");

    const msg = document.createElement("div");
    msg.classList.add("message", "bot-message", "qr-message");

    // 📱 bold label
    const label = document.createElement("div");
    label.innerHTML = "📱 <b>Scan to continue on WhatsApp</b>";

    // 🔗 styled link
    const linkEl = document.createElement("a");
    linkEl.href = link;
    linkEl.target = "_blank";
    linkEl.innerText = "Open WhatsApp";

    // 🎨 your custom color
    linkEl.style.color = "#25D366";  // WhatsApp green (change this)
    linkEl.style.fontWeight = "bold";
    linkEl.style.textDecoration = "none";

    // QR container
    const qrBox = document.createElement("div");
    qrBox.classList.add("qr-box");
    linkEl.classList.add("qr-link");

    msg.appendChild(label);
    msg.appendChild(qrBox);
    msg.appendChild(linkEl);

    chatArea.appendChild(msg);

    // generate QR
    new QRCode(qrBox, {
        text: link,
        width: 140,
        height: 140
    });

    // scroll
    const chatBody = document.getElementById("chatBody");
    chatBody.scrollTop = chatBody.scrollHeight;
}

function botReply(userText) {
    let reply = "I'm still learning 🍷";

    if (userText.toLowerCase().includes("wine")) {
        reply = "Ah, a fine choice. South Africa has world-class wines like Stellenbosch reds 🍇";
    } else if (userText.toLowerCase().includes("food")) {
        reply = "You should try a braai 🍖 — it's a South African classic!";
    } else if (userText.toLowerCase().includes("hello")) {
        reply = "Hey there! What can I recommend today? 🍷";
    }

    setTimeout(() => addMessage(reply, "bot"), 600);
}

function sendMessage() {
    const text = input.value.trim();
    if (text === "") return;

    addMessage(text, "user");
    input.value = "";

    botReply(text);
}
