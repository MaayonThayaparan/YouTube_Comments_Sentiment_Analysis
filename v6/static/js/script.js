document.addEventListener('DOMContentLoaded', function() {
    var checkbox = document.getElementById("toggleSectionCheckbox");
    checkbox.addEventListener('change', toggleSection);

    var form = document.getElementById("submit");
    form.addEventListener('submit', urlParser);
});

function toggleSection() {
    var section = document.getElementById("commentsTable");
    var checkbox = document.getElementById("toggleSectionCheckbox");
    if (checkbox.checked) {
        section.style.display = "block";
    } else {
        section.style.display = "none";
    }
}

function urlParser(event) {
    event.preventDefault(); // Prevents the form from submitting immediately
    var input = document.getElementById('text').value;
    var ID = '';
    // Transform the input URL here
    var url = input.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
      ID = url[2].split(/[^0-9a-z_\-]/i);
      ID = ID[0];
    }
    else {
      ID = url;
    }
    // Update the input value with the transformed value
    document.getElementById('text').value = ID;

    // Submit the form after the transformation
    event.target.submit();
}
