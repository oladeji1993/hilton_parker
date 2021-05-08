$(document).ready(function(){
    var show = document.getElementById('show');
    show.style.display = "none";
})

function check_pass() {
    if (document.getElementById('password').value ==
            document.getElementById('confirmPassword').value) {
        document.getElementById('activateButton').removeAttribute("disabled");

        var show = document.getElementById('show');
        show.style.display = "none";

    } else {
        document.getElementById('activateButton').setAttribute("disabled", "false");
        var show = document.getElementById('show');
        show.style.display = "block";
    }
}

