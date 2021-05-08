$(document).ready(function() {
      $(".menu-icon").on("click", function() {
            $("nav ul").toggleClass("showing");
      });
});

// Scrolling Effect

$(window).on("scroll", function() {
      if($(window).scrollTop()) {
            $('nav').addClass('black');
      }

      else {
            $('nav').removeClass('black');
      }
})


// Get the modal
var modal = document.getElementById("myModal");

var btn = document.getElementById("myBtn");

var span = document.getElementsByClassName("close")[0];
var cancel = document.getElementsByClassName("cancel")[0];

btn.onclick = function() {
  modal.style.display = "block";
}

span.onclick = function() {
  modal.style.display = "none";
}

cancel.onclick = function() {
      modal.style.display = "none";
}

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}
