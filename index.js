document.getElementById('sendBtn').addEventListener('click', () => {
    const userInput = document.getElementById('input').value;

    fetch('http://localhost:8080/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userInput })
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById('output').textContent = data.reply;
        })
        .catch(err => {
            document.getElementById('output').textContent = "Noget gik galt 😢";
            console.error(err);
        });
});
