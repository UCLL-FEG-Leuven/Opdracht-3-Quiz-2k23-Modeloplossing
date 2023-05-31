const mogelijkeAntwoordenRadioOptions = document.querySelectorAll('#vragen input[type="radio"]');

// In deze variabelen wordt de 'state' van de quiz bijgehouden.
let huidigeVraagIndex = -1;
let antwoorden = [];

// Deze fetch wordt uitgevoerd van zodra de browser dit quiz.js bestand heeft ingeladen.
// De vragen worden opgehaald via een GET Ajax call naar de backend.
// Opgelet: await kan hier op het 'root' niveau gebruikt worden zonder IIFE omdat het script aan de html is toegevoegd met het attribuut type="module".
let response = await fetch('/api/quiz');
let vragen = await response.json(); // De vragen worden 'onthouden' zodat we de backend niet meer moeten storen...
await gaNaarVolgende(); // En vervolgens wordt de eerste vraag getoond. (De gaNaarVolgende() function zal eerst huidigeVraagIndex++ doen, dus de index gaat van -1 naar 0.)

// Vervolgens wordt er een 'change' event handler gekoppeld aan alle radio options...
// Als de speler een antwoord kiest zal onderstaande handler dus afgaan: deze pusht een antwoord object op de array van antwoorden.
// Daarna wordt er naar de volgende vraag gegaan of naar het resultaat indien er geen vragen meer zijn. Ook hier zorgt gaNaarVolgende() function voor.
for (let i = 0; i < mogelijkeAntwoordenRadioOptions.length; i++) {
    // Het selecteren van een radio option triggert een 'change' event.
    mogelijkeAntwoordenRadioOptions[i].addEventListener('change', async function (e) {
        // Het antwoord van de speler wordt 'onthouden' in de array. Deze array zal later doorgestuurd worden via een POST Ajax call.
        antwoorden.push({
            vraagId: vragen[huidigeVraagIndex].id,
            gekozenAntwoordIndex: parseInt(this.value) // 'this' verwijst naar de radio option waarop geklikt werd. In value zit dus "0", "1", "2" of "3". Er moet en parseInt gebeuren omdat de backend numbers verwacht en geen strings!
        });

        // ga naar de volgende vraag of toon de resultaten.
        await gaNaarVolgende();
    });
}

// Deze functie gaat naar de volgende vraag.
// Of als er geen vragen meer zijn wordt het resultaat getoond.
async function gaNaarVolgende() {
    // Naar de volgende vraag gaan.
    huidigeVraagIndex++;

    // Controleren of er nog vragen zijn.
    if (huidigeVraagIndex < vragen.length) {
        // Er zijn nog vragen...
        document.querySelector('#vragen legend').innerText = vragen[huidigeVraagIndex].vraag;
        for (let i = 0; i < mogelijkeAntwoordenRadioOptions.length; i++) {
            // Een eventueel vorige antwoord 'unselecten' want een 'change' event gaat niet af voor een radio option dat al geselecteerd is.
            mogelijkeAntwoordenRadioOptions[i].checked = false;
        }
        document.getElementById('mogelijkAntwoord0').innerText = vragen[huidigeVraagIndex].mogelijkeAntwoorden[0];
        document.getElementById('mogelijkAntwoord1').innerText = vragen[huidigeVraagIndex].mogelijkeAntwoorden[1];
        document.getElementById('mogelijkAntwoord2').innerText = vragen[huidigeVraagIndex].mogelijkeAntwoorden[2];
        document.getElementById('mogelijkAntwoord3').innerText = vragen[huidigeVraagIndex].mogelijkeAntwoorden[3];
    } else {
        // Er zijn geen vragen meer... 
        // Het resultaat kan nu door de backend berekend worden.
        let response = await fetch('/api/quiz', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(antwoorden) // Hier wordt de antwoorden array naar JSON omgezet.
            });
        let resultaat = await response.json(); // En de POST geeft ook weer een JSON terug. Dit moet omgezet worden naar een JavaScript object.

        // Het 'resultaat' object heeft een 'score' property.
        document.querySelector("#resultaat h2").innerText = resultaat.score > 80 ? "Gewonnen!" : "Verloren :(";
        document.querySelector("#resultaat h2").className = resultaat.score > 80 ? "bg-success" : "bg-danger";
        document.getElementById("score").innerText = Math.round(resultaat.score);
        document.getElementById("vragen").className = "hidden"; // De section 'vragen' mag nu verborgen worden.
        document.getElementById("resultaat").className = ""; // En de section 'resultaat' kan getoond worden.
    }
}