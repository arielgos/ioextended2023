import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore, addDoc, collection, query, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

initializeApp(firebaseConfig);

const firestore = getFirestore();

$('form').on('submit', async (event) => {
    event.preventDefault();
    await addDoc(collection(firestore, "chats2"), {
        message: $('#message').val(),
        date: new Date().getTime()
    });
    $("#message").val('');
});

const chatQuery = query(collection(firestore, "chats2"), orderBy("date"));

onSnapshot(chatQuery, (querySnapshot) => {
    querySnapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const data = change.doc.data();
            var div = $("<div>").attr("class", "message");
            div.append("<div class='data'>" + data.message + "</div>");
            document.getElementById('audio').play();
            $("#chat #messages").append(div);
            $("#chat #messages").scrollTop($("#chat #messages .message").length * 150);
        }
    });
});



