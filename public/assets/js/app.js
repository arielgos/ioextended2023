import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { GoogleAuthProvider, getAuth, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, orderBy, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-storage.js";
import { firebaseConfig } from "./firebase.js";

initializeApp(firebaseConfig);

const auth = getAuth();
const firestore = getFirestore();
const storage = getStorage();
let user = null;

const positBackgrounds = ["#FCEC7D", "#EC86B9", "#B6E675", "#B2CBC2", "#C0D4CE"];

signInWithPopup(auth, new GoogleAuthProvider())
    .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        user = result.user;
        triggerEvents();
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
    });

async function loadFile(fileName, fileToUpload) {
    let reference = ref(storage, "public/" + fileName);
    await uploadBytes(reference, fileToUpload).then((snapshot) => {
        console.log('Uploaded a blob or file!');
    });
}

function triggerEvents() {

    $("form#msgbox").on("submit", async (event) => {
        event.preventDefault();
        await addDoc(collection(firestore, "chats"), {
            user: user.displayName,
            message: $("#message").val(),
            date: new Date().getTime()
        });
        $("#message").val('');
    });

    const chatQuery = query(collection(firestore, "chats"), orderBy("date"));
    onSnapshot(chatQuery, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                var div = $("<div>").attr("class", "message");
                div.append("<div class='data'>" + data.message + "</div>");
                div.append("<div class='user'>" + data.user + "</div>");
                if (data.user == user.displayName) {
                    div.addClass("right");
                } else {
                    document.getElementById('audio').play();
                }
                $("#chat #messages").append(div);
                $("#chat #messages").scrollTop($("#chat #messages .message").length * 150);
            }
        });

        //habilitamos la interfaz
        $("input").removeAttr("disabled");
        $("textarea").removeAttr("disabled");
        $("button").removeAttr("disabled");
    });

    $("#space").on('click', (event) => {
        $("input#posx").val(event.clientX);
        $("input#posy").val(event.clientY);
        $("#upload").show();
    });

    $("form#uploader").on("submit", async (event) => {
        event.preventDefault();
        await addDoc(collection(firestore, "posits"), {
            user: user.displayName,
            image: $("input#toUpload").val(),
            message: $("#details").val(),
            x: $("input#posx").val(),
            y: $("input#posy").val(),
            date: new Date().getTime(),

        });
        $("input#posx").val('');
        $("input#posy").val('');
        $("input#toUpload").val('');
        $("#details").val('');
        $("#upload").hide();
    });

    const positsQuery = query(collection(firestore, "posits"), orderBy("date"));
    onSnapshot(positsQuery, (querySnapshot) => {
        querySnapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const data = change.doc.data();
                const background = Math.floor(Math.random() * positBackgrounds.length);
                const degress = Math.floor(Math.random() * 45) * -1;
                const div = $("<div>", {
                    class: "posit",
                    style: "background-color:" + positBackgrounds[background] + ";left:" + data.x + "px;top:" + data.y + "px;transform:rotate(" + degress + "deg);"
                });
                div.append("<img src='https://firebasestorage.googleapis.com/v0/b/" + firebaseConfig.storageBucket + "/o/public%2F" + data.image + "?alt=media'>");
                div.append("<p>" + data.message + "</p>");
                $("#space").append(div);
                document.getElementById('audio').play();
            }
        });
    });

    $("input[type=file]").each(function () {
        $(this).change(async function (event) {
            let file = event.target.files[0];
            let fileName = Date.now()
            $("#toUpload").val(fileName);
            console.log("Compressing image...");
            new Compressor(file, {
                width: 240,
                height: 180,
                quality: 0.6,
                async success(result) {
                    const formData = new FormData();
                    formData.append('file', result, result.name);
                    console.log("Compressed image...");
                    console.log("Uploading image...");
                    await loadFile(fileName, result);
                    console.log("Uploaded image...");
                },
                error(err) {
                    console.log(err.message);
                },
            });

        });
    });
}

/**
 * 
 * 
 */