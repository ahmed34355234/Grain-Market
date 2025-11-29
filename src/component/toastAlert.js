data.errors.forEach(err => {
    const div = document.createElement("div");
    div.textContent = err.msg;
    div.style.position = "fixed";
    div.style.right = "20px";
    div.style.top = "50px";
    div.style.backgroundColor = "red";
    div.style.color = "white";
    div.style.padding = "5px 10px";
    div.style.borderRadius = "5px";
    document.body.appendChild(div);

    setTimeout(() => div.remove(), 3000); // auto disappear
});
