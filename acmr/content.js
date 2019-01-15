
function showNames() {
    let divEles = document.querySelectorAll('div.time-list.other > div.other > div.other-tip:first-child');
    let isNotShown = (window.getComputedStyle(divEles[0]).display === 'none');
    if (isNotShown) {
        divEles.forEach(ele => {
            ele.style.display = 'block';
        });
    } else {
        divEles.forEach(ele => {
            ele.style.display = '';
        });
    }
}

showNames()