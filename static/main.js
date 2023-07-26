//product counter
let pcs = document.querySelector("#pieces")
pcs.addEventListener('input', function (e) {
    pcs.value = pcs.value.replace(/[^0-9.]/g, '');
});
let price = document.querySelector("#price")
price.addEventListener('input', function (e) {
    price.value = price.value.replace(/[^0-9.]/g, '');
});
//counter +-
let up = document.querySelector(".clickable-counter .up")
let down = document.querySelector(".clickable-counter .down")
up.addEventListener('click', () => {
    ValidField(pcs);
    pcs.value++;
})
down.addEventListener('click', () => {
    ValidField(pcs);
    if (pcs.value > 1) pcs.value--;
})

/**
 * 
 * @param {Element} e
 */
function InvalidField(e) {
    if (e.classList.contains("ok")) e.classList.remove("ok")
    e.classList.add("error")
}
/**
 * 
 * @param {Element} e
 */
function ValidField(e) {
    if (e.classList.contains("error")) e.classList.remove("error")
    e.classList.add("ok")
}
/**
 * 
 * @param {Element} e
 */
function IsFormValid(e) {
    let valid = true;
    let inputs;
    if (e) {
        inputs = [e];
    } else { inputs = document.querySelectorAll("form input"); }

    inputs.forEach((input) => {
        if (input.type === 'email' || input.type === 'tel') {
            let regexes = {
                //jmeno@domena.tld
                "email": /\S+@\S+\.\S+/,
                //+420 xxx xxx xxx, xxx xxx xxx, +49 ..
                "tel": /^(\+?(\()?[0-9\./ -]{9,}|\+?(\()?([0-9]{3})(\))?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6})$/
            }
            if (!regexes[input.type].test(input.value.replace(/\s/g, ''))) {
                InvalidField(input);
                valid = false;
                console.table(input.value.replace(/\s/g, ''), regexes[input.type])
            } else {
                ValidField(input);
            }
            return;
        }
        //psc
        if (input.required && input.value.trim() === '') {
            InvalidField(input);
            valid = false;
        } else {
            ValidField(input);
        }
    })
    return valid;
}
//input checker
document.querySelectorAll('input').forEach(e => {
    //normal field switch
    e.addEventListener('focusout', (e) => {
        IsFormValid(e.target);
    });
    //autocomplete
    e.addEventListener('change', (e) => {
        IsFormValid(e.target);
    });
});

//pokračovat btn
let c = document.querySelector(".continue")
c.addEventListener("click", (e) => {
    e.preventDefault();
    if (!IsFormValid()) return;
    c.innerHTML = "Načítání..."
    //fetch cnb data
    fetch("./api/cnb.php")
        .then(r => r.json())
        .then(json => {
            if (json.error) {
                alert(`ČNB api odpovědělo s errorem ${json.code}.`)
                return;
            }
            document.querySelector('.data').style.display = "none";
            document.querySelector('.recap').style.display = "block";

            let dropdown = document.querySelector(".recap select");

            //add all curr
            json.data.rates.forEach(curr => {
                let option = document.createElement('option');
                option.value = curr.currencyCode;
                option.text = `${curr.country} (${curr.currencyCode})`;
                option.setAttribute('data-rate', curr.rate);
                option.setAttribute('data-amount', curr.amount);
                dropdown.appendChild(option);
            });
            //use NiceSelect
            NiceSelect.bind(dropdown,
                {
                    searchable: true,
                    placeholder: 'Česká republika (CZK)',
                    searchtext: 'Hledat',
                });
            //data from prev form
            let productName = document.querySelector("#product-name").value;
            let totalPrice = price.value * pcs.value;
            let totalPriceDPH = (totalPrice * 1.21).toFixed(2);
            //load data from first page, without product price and pcs
            let inputs = document.querySelectorAll("form input");
            let pageOne = '';
            inputs.forEach(input => {
                if (input.id == "price" || input.id == "pieces") return;
                let fieldName = document.querySelector(`[for=${input.id}]`).textContent;
                pageOne += `<p><b>${fieldName}:</b> ${input.value}</p>`;
            });
            document.querySelector(".info").innerHTML = `
            ${pageOne}
            <p><b>Celková cena (bez DPH):</b> <span class="price-without-dph">${totalPrice} CZK</span></p>
            <p><b>Celková cena (s 21% DPH):</b> <span class="price-with-dph">${totalPriceDPH} CZK</span></p>
            `;
            //listen for change curr
            dropdown.addEventListener('change', (e) => {
                let option = e.target.options[e.target.selectedIndex];

                // Get the value and data-info attribute of the selected option
                let value = option.value;
                if (value == "CZK") { //default
                    document.querySelector('.price-without-dph').innerHTML = `${totalPrice} CZK`
                    document.querySelector('.price-with-dph').innerHTML = `${totalPriceDPH} CZK`
                    return;
                }
                let rate = +option.getAttribute('data-rate');
                let amount = +option.getAttribute('data-amount');
                if (!value || !rate || !amount) return;
                let convertedPrice = (totalPrice) / (rate / amount);
                let roundedPrice = convertedPrice.toFixed(2);
                let priceWithDPH = (convertedPrice * 1.21).toFixed(2);
                document.querySelector('.price-without-dph').innerHTML = `${roundedPrice} ${value} (${totalPrice} CZK)`
                document.querySelector('.price-with-dph').innerHTML = `${priceWithDPH} ${value} (${totalPriceDPH} CZK)`
            })
        }).catch((e) => {
            console.log(e);
            alert("Nastala chyba při načítání dat z ČNB.")
        });
})

//send btn
let send = document.querySelector(".send")
send.addEventListener("click", (e) => {
    e.preventDefault();
    let inputs = document.querySelectorAll("form input");
    let send = '';
    inputs.forEach(input => {
        let fieldName = document.querySelector(`[for=${input.id}]`).textContent;
        send += `${fieldName}: ${input.value}\n`;
    });

    send += `Vybraná měna: ${document.querySelector(".recap select").value}\n`;
    send += "Celkem bez DPH: " + document.querySelector('.price-without-dph').textContent + "\n";
    send += "Celkem s 21% DPH: " + document.querySelector('.price-with-dph').textContent + "\n";
    alert(`Odeslané informace: \n${send}`)
})