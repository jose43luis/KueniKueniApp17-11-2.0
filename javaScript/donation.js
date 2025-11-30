// donation.js - Sistema de donaciones con validación de tarjetas y conexión a Supabase

// Definir tipos de tarjetas con sus patrones
const cardTypes = {
    visa: {
        pattern: /^4/,
        lengths: [13, 16, 19],
        cvvLength: 3,
        name: 'Visa',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIxNy45ODI0MzkwMjQzOTAyNDIiIHZpZXdCb3g9IjAgMCAxMDI1IDc2OCI+PHBhdGggZmlsbD0iIzRmNDZlNSIgZD0iTTk2MC4zMSA3NjhoLTg5NnEtMjYgMC00NS0xOC41VCAuMzEgNzA0VjU3NmgxMDI0djEyOHEwIDI3LTE4LjUgNDUuNXQtNDUuNSAxOC41TS4zMSA2NHEwLTI2IDE4LjUtNDV0NDUuNS0xOWg4OTZxMjcgMCA0NS41IDE5dDE4LjUgNDV2NjRILjMxem0zMjkgNDQ4bDUyLTMyMGg4M2wtNTIgMzIwem01MjktMzIwaDY3bDY3IDMyMGgtNzdsLTE5LTMyaC05NmwtMTggMzJoLTg3bDEyNC0yOTZsMS0yLjVsNC02bDctN2wxMS02em0zOCAyMjRsLTI5LTEzN2wtMzUgMTM3em0tMzM4IDk2cS0yNSAwLTQ5LTQuNXQtMzQtOC41bC0xMS00bDEyLTcwcTE3IDE0IDUwIDE5LjV0NjAuNS0xdDI3LjUtMjYuNXEwLTEzLTE4LTI1LjV0LTQwLTIxLjV0LTQwLTI5dC0xOC00N3EwLTI5IDE1LjUtNTF0MzkuNS0zMnQ0NS0xNC41dDQwLTQuNXExNyAwIDM2IDMuNXQyOSA2LjVsMTAgM2wtMTIgNjdxLTI2LTE2LTcxLjUtMTQuNXQtNDUuNSAyNS41cTAgMTIgMTguNSAyMy41dDQwLjUgMjF0NDAgMzAuNXQxOCA0OHEwIDM2LTI0LjUgNjEuNXQtNTUuNSAzNXQtNjMgOS41bS00NTYtMzIwcTE2IDAgMjUuNSA3LjV0MTEuNSAxNC41bDIgN2wyOCAxNDRsMTAgNDdsNzktMjIwaDkwbC0xMzMgMzIwaC04N2wtNzItMjc4cS0yMi0xMy01Ni0yNHYtMTh6Ii8+PC9zdmc+'
    },
    mastercard: {
        pattern: /^(5[1-5]|2[2-7])/,
        lengths: [16],
        cvvLength: 3,
        name: 'Mastercard',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIxOC42NTYyNSIgdmlld0JveD0iMCAwIDI1NiAxOTkiPjxwYXRoIGQ9Ik00Ni41NCAxOTguMDExVjE4NC44NGMwLTUuMDUtMy4wNzQtOC4zNDItOC4zNDMtOC4zNDJjLTIuNjM0IDAtNS40ODguODc4LTcuNDY0IDMuNzMyYy0xLjUzNi0yLjQxNS0zLjczMS0zLjczMi03LjAyNC0zLjczMmMtMi4xOTYgMC00LjM5LjY1OC02LjE0NyAzLjA3M3YtMi42MzRoLTQuNjF2MjEuMDc0aDQuNjF2LTExLjYzNWMwLTMuNzMxIDEuOTc2LTUuNDg4IDUuMDUtNS40ODhjMy4wNzIgMCA0LjYxIDEuOTc2IDQuNjEgNS40ODh2MTEuNjM1aDQuNjF2LTExLjYzNWMwLTMuNzMxIDIuMTk0LTUuNDg4IDUuMDQ4LTUuNDg4YzMuMDc0IDAgNC42MSAxLjk3NiA0LjYxIDUuNDg4djExLjYzNXptNjguMjcxLTIxLjA3NGgtNy40NjN2LTYuMzY2aC00LjYxdjYuMzY2aC00LjE3MXY0LjE3aDQuMTd2OS42NmMwIDQuODMgMS45NzYgNy42ODMgNy4yNDUgNy42ODNjMS45NzYgMCA0LjE3LS42NTggNS43MDgtMS41MzZsLTEuMzE4LTMuOTUyYy0xLjMxNy44NzgtMi44NTMgMS4wOTgtMy45NTEgMS4wOThjLTIuMTk1IDAtMy4wNzMtMS4zMTctMy4wNzMtMy41MTN2LTkuNDRoNy40NjN6bTM5LjA3Ni0uNDRjLTIuNjM0IDAtNC4zOSAxLjMxOC01LjQ4OCAzLjA3NHYtMi42MzRoLTQuNjF2MjEuMDc0aDQuNjF2LTExLjg1NGMwLTMuNTEyIDEuNTM2LTUuNDg4IDQuMzktNS40ODhjLjg3OCAwIDEuOTc2LjIyIDIuODU0LjQzOWwxLjMxNy00LjM5Yy0uODc4LS4yMi0yLjE5NS0uMjItMy4wNzMtLjIybS01OS4wNTIgMi4xOTZjLTIuMTk2LTEuNTM3LTUuMjY5LTIuMTk1LTguNTYyLTIuMTk1Yy01LjI2OCAwLTguNzggMi42MzQtOC43OCA2LjgwNWMwIDMuNTEzIDIuNjM0IDUuNDg4IDcuMjQ0IDYuMTQ3bDIuMTk1LjIyYzIuNDE1LjQzOCAzLjczMiAxLjA5NyAzLjczMiAyLjE5NWMwIDEuNTM2LTEuNzU2IDIuNjM0LTQuODMgMi42MzRzLTUuNDg4LTEuMDk4LTcuMDI1LTIuMTk1bC0yLjE5NSAzLjUxMmMyLjQxNSAxLjc1NiA1LjcwOCAyLjYzNCA5IDIuNjM0YzYuMTQ3IDAgOS42Ni0yLjg1MyA5LjY2LTYuODA1YzAtMy43MzItMi44NTQtNS43MDgtNy4yNDUtNi4zNjZsLTIuMTk1LS4yMmMtMS45NzYtLjIyLTMuNTEyLS42NTgtMy41MTItMS45NzVjMC0xLjUzNyAxLjUzNi0yLjQxNSAzLjk1MS0yLjQxNWMyLjYzNSAwIDUuMjY5IDEuMDk3IDYuNTg2IDEuNzU2em0xMjIuNDk1LTIuMTk1Yy0yLjYzNSAwLTQuMzkxIDEuMzE3LTUuNDg5IDMuMDczdi0yLjYzNGgtNC42MXYyMS4wNzRoNC42MXYtMTEuODU0YzAtMy41MTIgMS41MzctNS40ODggNC4zOS01LjQ4OGMuODc5IDAgMS45NzcuMjIgMi44NTUuNDM5bDEuMzE3LTQuMzljLS44NzgtLjIyLTIuMTk1LS4yMi0zLjA3My0uMjJtLTU4LjgzMyAxMC45NzZjMCA2LjM2NiA0LjM5IDEwLjk3NiAxMS4xOTYgMTAuOTc2YzMuMDczIDAgNS4yNjgtLjY1OCA3LjQ2My0yLjQxNGwtMi4xOTUtMy43MzJjLTEuNzU2IDEuMzE3LTMuNTEyIDEuOTc1LTUuNDg4IDEuOTc1Yy0zLjczMiAwLTYuMzY2LTIuNjM0LTYuMzY2LTYuODA1YzAtMy45NTEgMi42MzQtNi41ODYgNi4zNjYtNi44MDVjMS45NzYgMCAzLjczMi42NTggNS40ODggMS45NzZsMi4xOTUtMy43MzJjLTIuMTk1LTEuNzU3LTQuMzktMi40MTUtNy40NjMtMi40MTVjLTYuODA2IDAtMTEuMTk2IDQuNjEtMTEuMTk2IDEwLjk3Nm00Mi41ODggMHYtMTAuNTM3aC00LjYxdjIuNjM0Yy0xLjUzNy0xLjk3NS0zLjczMi0zLjA3My02LjU4Ni0zLjA3M2MtNS45MjcgMC0xMC41MzcgNC42MS0xMC41MzcgMTAuOTc2czQuNjEgMTAuOTc2IDEwLjUzNyAxMC45NzZjMy4wNzMgMCA1LjI2OS0xLjA5NyA2LjU4Ni0zLjA3M3YyLjYzNGg0LjYxem0tMTYuOTA0IDBjMC0zLjczMiAyLjQxNS02LjgwNSA2LjM2Ni02LjgwNWMzLjczMiAwIDYuMzY3IDIuODU0IDYuMzY3IDYuODA1YzAgMy43MzItMi42MzUgNi44MDUtNi4zNjcgNi44MDVjLTMuOTUxLS4yMi02LjM2Ni0zLjA3My02LjM2Ni02LjgwNW0tNTUuMS0xMC45NzZjLTYuMTQ3IDAtMTAuNTM4IDQuMzktMTAuNTM4IDEwLjk3NnM0LjM5IDEwLjk3NiAxMC43NTcgMTAuOTc2YzMuMDczIDAgNi4xNDctLjg3OCA4LjU2Mi0yLjg1M2wtMi4xOTYtMy4yOTNjLTEuNzU2IDEuMzE3LTMuOTUxIDIuMTk1LTYuMTQ2IDIuMTk1Yy0yLjg1NCAwLTUuNzA4LTEuMzE3LTYuMzY3LTUuMDVoMTUuNTg3di0xLjc1NWMuMjItNi44MDYtMy43MzItMTEuMTk2LTkuNjYtMTEuMTk2bTAgMy45NTFjMi44NTMgMCA0LjgzIDEuNzU3IDUuMjY4IDUuMDVoLTEwLjk3NmMuNDM5LTIuODU0IDIuNDE1LTUuMDUgNS43MDgtNS4wNW0xMTQuMzcyIDcuMDI1di0xOC44NzloLTQuNjF2MTAuOTc2Yy0xLjUzNy0xLjk3NS0zLjczMi0zLjA3My02LjU4Ni0zLjA3M2MtNS45MjcgMC0xMC41MzcgNC42MS0xMC41MzcgMTAuOTc2czQuNjEgMTAuOTc2IDEwLjUzNyAxMC45NzZjMy4wNzQgMCA1LjI2OS0xLjA5NyA2LjU4Ni0zLjA3M3YyLjYzNGg0LjYxem0tMTYuOTAzIDBjMC0zLjczMiAyLjQxNC02LjgwNSA2LjM2Ni02LjgwNWMzLjczMiAwIDYuMzY2IDIuODU0IDYuMzY2IDYuODA1YzAgMy43MzItMi42MzQgNi44MDUtNi4zNjYgNi44MDVjLTMuOTUyLS4yMi02LjM2Ni0zLjA3My02LjM2Ni02LjgwNW0tMTU0LjEwNyAwdi0xMC41MzdoLTQuNjF2Mi42MzRjLTEuNTM3LTEuOTc1LTMuNzMyLTMuMDczLTYuNTg2LTMuMDczYy01LjkyNyAwLTEwLjUzNyA0LjYxLTEwLjUzNyAxMC45NzZzNC42MSAxMC45NzYgMTAuNTM3IDEwLjk3NmMzLjA3NCAwIDUuMjY5LTEuMDk3IDYuNTg2LTMuMDczdjIuNjM0aDQuNjF6bS0xNy4xMjMgMGMwLTMuNzMyIDIuNDE1LTYuODA1IDYuMzY2LTYuODA1YzMuNzMyIDAgNi4zNjcgMi44NTQgNi4zNjcgNi44MDVjMCAzLjczMi0yLjYzNSA2LjgwNS02LjM2NyA2LjgwNWMtMy45NTEtLjIyLTYuMzY2LTMuMDczLTYuMzY2LTYuODA1Ii8+PHBhdGggZmlsbD0iI0ZGNUYwMCIgZD0iTTkzLjI5OCAxNi45MDNoNjkuMTV2MTI0LjI1MWgtNjkuMTV6Ii8+PHBhdGggZmlsbD0iI0VCMDAxQiIgZD0iTTk3LjY4OSA3OS4wMjljMC0yNS4yNDUgMTEuODU0LTQ3LjYzNyAzMC4wNzQtNjIuMTI2QzExNC4zNzMgNi4zNjYgOTcuNDcgMCA3OS4wMyAwQzM1LjM0MyAwIDAgMzUuMzQzIDAgNzkuMDI5czM1LjM0MyA3OS4wMjkgNzkuMDI5IDc5LjAyOWMxOC40NCAwIDM1LjM0My02LjM2NiA0OC43MzQtMTYuOTA0Yy0xOC4yMi0xNC4yNjktMzAuMDc0LTM2Ljg4LTMwLjA3NC02Mi4xMjUiLz48cGF0aCBmaWxsPSIjRjc5RTFCIiBkPSJNMjU1Ljc0NiA3OS4wMjljMCA0My42ODUtMzUuMzQzIDc5LjAyOS03OS4wMjkgNzkuMDI5Yy0xOC40NCAwLTM1LjM0My02LjM2Ni00OC43MzQtMTYuOTA0YzE4LjQ0LTE0LjQ4OCAzMC4wNzUtMzYuODggMzAuMDc1LTYyLjEyNXMtMTEuODU1LTQ3LjYzNy0zMC4wNzUtNjIuMTI2QzE0MS4zNzMgNi4zNjYgMTU4LjI3NyAwIDE3Ni43MTcgMGM0My42ODYgMCA3OS4wMyAzNS41NjMgNzkuMDMgNzkuMDI5Ii8+PC9zdmc+'
    },
    amex: {
        pattern: /^3[47]/,
        lengths: [15],
        cvvLength: 4,
        name: 'American Express',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyMS4zMzMzMzMzMzMzMzMzMzIiIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48cGF0aCBmaWxsPSIjMDI0ZGM1IiBkPSJNMCA0MzJjMCAyNi41IDIxLjUgNDggNDggNDhoNDgwYzI2LjUgMCA0OC0yMS41IDQ4LTQ4di0xLjFoLTYxLjdsLTMxLjktMzUuMWwtMzEuOSAzNS4xSDI0Ni44VjI2Ny4xSDE4MWw4MS43LTE4NC43aDc4LjZsMjguMSA2My4yVjgyLjRoOTcuMmwxNi45IDQ3LjZsMTctNDcuNkg1NzZWODBjMC0yNi41LTIxLjUtNDgtNDgtNDhINDhDMjEuNSAzMiAwIDUzLjUgMCA4MHptNDQwLjQtMjEuN2w0Mi4yLTQ2LjNsNDIgNDYuM0g1NzZsLTY4LTcyLjFsNjgtNzIuMWgtNTAuNmwtNDIgNDYuN2wtNDEuNS00Ni43aC01MS40bDY3LjUgNzIuNWwtNjcuNCA3MS42di0zMy4xaC04M3YtMjIuMmg4MC45di0zMi4zaC04MC45di0yMi40aDgzdi0zMy4xaC0xMjJ2MTQzLjJ6bTk2LjMtNzJsMzkuMyA0MS45di04My4zem0tMzYuMy05MmwzNi45LTEwMC42djEwMC42SDU3NlYxMDNoLTYwLjJsLTMyLjIgODkuM2wtMzEuOS04OS4zaC02MS4ydjE0My4xTDMyNy4zIDEwM2gtNTEuMmwtNjIuNCAxNDMuM2g0M2wxMS45LTI4LjdoNjUuOWwxMiAyOC43aDgyLjdWMTQ2TDQ2NiAyNDYuM3pNMjgyIDE4NS40bDE5LjUtNDYuOWwxOS40IDQ2Ljl6Ii8+PC9zdmc+'
    },
    discover: {
        pattern: /^6(?:011|5)/,
        lengths: [16, 19],
        cvvLength: 3,
        name: 'Discover',
        logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDIzMDQgMTUzNiI+PHBhdGggZmlsbD0iI2VhNTgwYyIgZD0iTTMxMyA2NDlxMCA1MS0zNiA4NHEtMjkgMjYtODkgMjZoLTE3VjUzOWgxN3E2MSAwIDg5IDI3cTM2IDMxIDM2IDgzbTE3NzYtNjVxMCA1Mi02NCA1MmgtMTlWNTM1aDIwcTYzIDAgNjMgNDlNMzgwIDY0OXEwLTc0LTUwLTEyMC41VDIwMSA0ODJoLTk1djMzM2g5NXE3NCAwIDExOS0zOHE2MC01MSA2MC0xMjhtMzAgMTY2aDY1VjQ4MmgtNjV6bTMyMC0xMDFxMC00MC0yMC41LTYyVDYzNCA2MTBxLTI5LTEwLTM5LjUtMTlUNTg0IDU2OHEwLTE2IDEzLjUtMjYuNVQ2MzIgNTMxcTI5IDAgNTMgMjdsMzQtNDRxLTQxLTM3LTk4LTM3cS00NCAwLTc0IDI3LjVUNTE3IDU3MnEwIDM1IDE4IDU1LjV0NjQgMzYuNXEzNyAxMyA0NSAxOXExOSAxMiAxOSAzNHEwIDIwLTE0IDMzLjVUNjEzIDc2NHEtNDggMC03MS00NGwtNDIgNDBxNDQgNjQgMTE1IDY0cTUxIDAgODMtMzAuNXQzMi03OS41bTI3OCA5MHYtNzdxLTM3IDM3LTc4IDM3cS00OSAwLTgwLjUtMzIuNVQ4MTggNjQ5cTAtNDggMzEuNS04MS41VDkyNyA1MzRxNDMgMCA4MSAzOHYtNzdxLTQwLTIwLTgwLTIwcS03NCAwLTEyNS41IDUwLjVUNzUxIDY0OXQ1MSAxMjMuNVQ5MjcgODIzcTQyIDAgODEtMTltMTIzMiA2MDRWODgxcS02NSA0MC0xNDQuNSA4NFQxODU4IDEwODJ0LTMyOS41IDEzNy41VDExMTEgMTM1NHQtNTA0IDExOGgxNTY5cTI2IDAgNDUtMTl0MTktNDVtLTg1MS03NTdxMC03NS01My0xMjh0LTEyOC01M3QtMTI4IDUzdC01MyAxMjh0NTMgMTI4dDEyOCA1M3QxMjgtNTN0NTMtMTI4bTE1MiAxNzNsMTQ0LTM0MmgtNzFsLTkwIDIyNGwtODktMjI0aC03MWwxNDIgMzQyem0xNzMtOWgxODR2LTU2aC0xMTl2LTkwaDExNXYtNTZoLTExNXYtNzRoMTE5di01N2gtMTg0em0zOTEgMGg4MGwtMTA1LTE0MHE3Ni0xNiA3Ni05NHEwLTQ3LTMxLTczdC04Ny0yNmgtOTd2MzMzaDY1VjY4Mmg5em0xOTktNjgxdjEyNjhxMCA1Ni0zOC41IDk1dC05My41IDM5SDEzMnEtNTUgMC05My41LTM5VDAgMTQwMlYxMzRxMC01NiAzOC41LTk1VDEzMiAwaDIwNDBxNTUgMCA5My41IDM5dDM4LjUgOTUiLz48L3N2Zz4='
    }
};

// ============================================
// FUNCIONES DE VALIDACIÓN DE TARJETA
// ============================================

// Detectar tipo de tarjeta
function detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');

    for (const [type, config] of Object.entries(cardTypes)) {
        if (config.pattern.test(cleanNumber)) {
            return { type, config };
        }
    }

    return null;
}

// Validar usando algoritmo de Luhn
function luhnCheck(number) {
    const cleanNumber = number.replace(/\s/g, '');
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cleanNumber[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

// Formatear número de tarjeta
function formatCardNumber(value, cardType) {
    const cleanValue = value.replace(/\s/g, '');

    if (cardType?.type === 'amex') {
        // American Express: 4-6-5
        return cleanValue.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3').trim();
    } else {
        // Otras tarjetas: 4-4-4-4
        return cleanValue.replace(/(\d{4})/g, '$1 ').trim();
    }
}

// Formatear fecha de expiración
function formatExpiry(value) {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length >= 2) {
        return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }

    return cleanValue;
}

// Validar fecha de expiración
function validateExpiry(value) {
    const parts = value.split('/');

    if (parts.length !== 2) return false;

    const month = parseInt(parts[0]);
    const year = parseInt('20' + parts[1]);

    if (month < 1 || month > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;

    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    let selectedAmount = 0;
    let isCustomAmount = false;
    let currentCardType = null;

    // Elementos del DOM
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const donationForm = document.getElementById('donationForm');
    const summaryAmount = document.getElementById('summaryAmount');
    const donateAmountBtn = document.getElementById('donateAmount');
    const impactAmount = document.getElementById('impactAmount');
    const destinoSelect = document.getElementById('destino');
    const tipoDonacion = document.querySelectorAll('input[name="tipo-donacion"]');

    // Card inputs
    const cardNumber = document.getElementById('card-number');
    const expiry = document.getElementById('expiry');
    const cvv = document.getElementById('cvv');

    // ============================================
    // AGREGAR CONTENEDOR PARA LOGO DE TARJETA
    // ============================================
    if (cardNumber) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-input-wrapper';
        cardNumber.parentNode.insertBefore(wrapper, cardNumber);
        wrapper.appendChild(cardNumber);

        const logoContainer = document.createElement('div');
        logoContainer.className = 'card-logo';
        logoContainer.id = 'card-logo';
        wrapper.appendChild(logoContainer);

        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.id = 'card-error';
        wrapper.appendChild(errorMsg);
    }

    // ============================================
    // MANEJO DE SELECCIÓN DE MONTOS
    // ============================================
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remover selección previa
            amountButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            const amount = this.dataset.amount;

            if (amount === 'custom') {
                isCustomAmount = true;
                customAmountInput.style.display = 'block';
                customAmountInput.focus();
                selectedAmount = parseFloat(customAmountInput.value) || 0;
            } else {
                isCustomAmount = false;
                customAmountInput.style.display = 'none';
                selectedAmount = parseFloat(amount);
            }

            updateSummary();
        });
    });

    // Monto personalizado
    customAmountInput.addEventListener('input', function () {
        selectedAmount = parseFloat(this.value) || 0;
        updateSummary();
    });

    // Actualizar resumen cuando cambia destino o tipo
    destinoSelect.addEventListener('change', updateSummary);
    tipoDonacion.forEach(radio => {
        radio.addEventListener('change', updateSummary);
    });

    // ============================================
    // FORMATEO Y VALIDACIÓN DE TARJETA
    // ============================================
    if (cardNumber) {
        cardNumber.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '');

            // Limitar solo a números
            value = value.replace(/\D/g, '');

            // Detectar tipo de tarjeta
            const detectedCard = detectCardType(value);
            currentCardType = detectedCard;

            // Mostrar logo
            const logoContainer = document.getElementById('card-logo');
            if (detectedCard && logoContainer) {
                logoContainer.innerHTML = `<img src="${detectedCard.config.logo}" alt="${detectedCard.config.name}">`;
                logoContainer.classList.add('active');
            } else if (logoContainer) {
                logoContainer.classList.remove('active');
            }

            // Limitar longitud según tipo de tarjeta
            let maxLength = 16;
            if (detectedCard) {
                maxLength = Math.max(...detectedCard.config.lengths);
            }

            if (value.length > maxLength) {
                value = value.slice(0, maxLength);
            }

            // Formatear
            const formatted = formatCardNumber(value, detectedCard);
            e.target.value = formatted;

            // Validar
            const errorMsg = document.getElementById('card-error');

            if (value.length >= 13) {
                const isValidLength = detectedCard ?
                    detectedCard.config.lengths.includes(value.length) :
                    value.length === 16;

                const isValidLuhn = luhnCheck(value);

                if (isValidLength && isValidLuhn) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                    if (errorMsg) {
                        errorMsg.classList.remove('active');
                    }
                } else {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                    if (errorMsg) {
                        errorMsg.textContent = 'Número de tarjeta inválido';
                        errorMsg.classList.add('active');
                    }
                }
            } else {
                e.target.classList.remove('valid', 'invalid');
                if (errorMsg) {
                    errorMsg.classList.remove('active');
                }
            }

            // Actualizar longitud de CVV
            if (cvv && detectedCard) {
                cvv.maxLength = detectedCard.config.cvvLength;
                cvv.placeholder = detectedCard.config.cvvLength === 4 ? '1234' : '123';
            }
        });
    }

    // Validar fecha de expiración
    if (expiry) {
        expiry.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length > 4) {
                value = value.slice(0, 4);
            }

            e.target.value = formatExpiry(value);

            if (value.length === 4) {
                if (validateExpiry(e.target.value)) {
                    e.target.classList.add('valid');
                    e.target.classList.remove('invalid');
                } else {
                    e.target.classList.add('invalid');
                    e.target.classList.remove('valid');
                }
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        });
    }

    // Validar CVV
    if (cvv) {
        cvv.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');

            const expectedLength = currentCardType?.config.cvvLength || 3;

            if (value.length > expectedLength) {
                value = value.slice(0, expectedLength);
            }

            e.target.value = value;

            if (value.length === expectedLength) {
                e.target.classList.add('valid');
                e.target.classList.remove('invalid');
            } else if (value.length > 0) {
                e.target.classList.add('invalid');
                e.target.classList.remove('valid');
            } else {
                e.target.classList.remove('valid', 'invalid');
            }
        });
    }

    // ============================================
    // ACTUALIZAR RESUMEN
    // ============================================
    function updateSummary() {
        const formattedAmount = selectedAmount.toLocaleString('es-MX');
        summaryAmount.textContent = `$${formattedAmount} MXN`;
        donateAmountBtn.textContent = formattedAmount;
        impactAmount.textContent = formattedAmount;

        // Actualizar tipo
        const tipoSeleccionado = document.querySelector('input[name="tipo-donacion"]:checked').value;
        const tipoBadge = document.querySelector('.summary-badge');
        tipoBadge.textContent = tipoSeleccionado === 'unica' ? 'Única' : 'Mensual';

        // Actualizar destino
        const destinoText = destinoSelect.options[destinoSelect.selectedIndex].text;
        document.querySelector('.summary-value-small').textContent = destinoText;
    }

    // ============================================
    // VALIDAR TARJETA MEJORADO
    // ============================================
    function validarTarjeta() {
        const cardNum = cardNumber.value.replace(/\s/g, '');
        const expiryVal = expiry.value;
        const cvvVal = cvv.value;

        // Validar número de tarjeta con Luhn
        if (cardNum.length < 13 || !luhnCheck(cardNum)) {
            mostrarMensaje('Número de tarjeta inválido', 'error');
            cardNumber.classList.add('invalid');
            return false;
        }

        // Validar longitud según tipo de tarjeta
        if (currentCardType) {
            if (!currentCardType.config.lengths.includes(cardNum.length)) {
                mostrarMensaje(`Número de tarjeta ${currentCardType.config.name} debe tener ${currentCardType.config.lengths.join(' o ')} dígitos`, 'error');
                return false;
            }
        }

        // Validar formato de fecha
        if (!/^\d{2}\/\d{2}$/.test(expiryVal)) {
            mostrarMensaje('Fecha de expiración inválida (MM/AA)', 'error');
            expiry.classList.add('invalid');
            return false;
        }

        // Validar que no esté vencida
        if (!validateExpiry(expiryVal)) {
            mostrarMensaje('La tarjeta está vencida', 'error');
            expiry.classList.add('invalid');
            return false;
        }

        // Validar CVV según tipo de tarjeta
        const expectedCvvLength = currentCardType?.config.cvvLength || 3;
        if (cvvVal.length !== expectedCvvLength) {
            mostrarMensaje(`CVV debe tener ${expectedCvvLength} dígitos`, 'error');
            cvv.classList.add('invalid');
            return false;
        }

        return true;
    }

    // ============================================
    // ENVIAR FORMULARIO
    // ============================================
    donationForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validar que se haya seleccionado un monto
        if (selectedAmount <= 0) {
            mostrarMensaje('Por favor selecciona un monto de donación', 'error');
            return;
        }

        // Validar campos de tarjeta
        if (!validarTarjeta()) {
            return;
        }

        // Obtener datos del formulario
        const formData = {
            donante_nombre: document.getElementById('nombre').value.trim(),
            donante_email: document.getElementById('email').value.trim(),
            donante_telefono: null,
            monto: selectedAmount,
            moneda: 'MXN',
            metodo_pago: 'tarjeta',
            estado_pago: 'completado',
            descripcion: obtenerDescripcionDonacion(),
            referencia_pago: generarReferenciaPago(),
            socio_id: obtenerSocioId()
        };

        console.log('Datos de donación:', formData);

        // Guardar en Supabase
        await guardarDonacion(formData);
    });

    // ============================================
    // GUARDAR DONACIÓN EN SUPABASE
    // ============================================
    async function guardarDonacion(datos) {
        if (!window.supabaseClient) {
            mostrarMensaje('Error: No se pudo conectar con la base de datos', 'error');
            console.error('Supabase no está configurado');
            return;
        }

        try {
            mostrarCargando(true);

            console.log('Guardando donación...');

            const { data, error } = await window.supabaseClient
                .from('donaciones')
                .insert([datos])
                .select();

            if (error) {
                console.error('Error al guardar donación:', error);
                mostrarMensaje('Error al procesar la donación. Intenta nuevamente.', 'error');
                return;
            }

            console.log('Donación guardada exitosamente:', data);

            // Mostrar mensaje de éxito
            mostrarMensajeExito(datos);

            // Limpiar formulario después de 3 segundos
            setTimeout(() => {
                donationForm.reset();
                selectedAmount = 0;
                currentCardType = null;
                updateSummary();
                amountButtons.forEach(btn => btn.classList.remove('selected'));
                customAmountInput.style.display = 'none';

                // Limpiar estados de validación
                cardNumber.classList.remove('valid', 'invalid');
                expiry.classList.remove('valid', 'invalid');
                cvv.classList.remove('valid', 'invalid');

                const logoContainer = document.getElementById('card-logo');
                if (logoContainer) {
                    logoContainer.classList.remove('active');
                }
            }, 3000);

        } catch (error) {
            console.error('Error inesperado:', error);
            mostrarMensaje('Error al procesar la donación', 'error');
        } finally {
            mostrarCargando(false);
        }
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================
    function obtenerDescripcionDonacion() {
        const destino = destinoSelect.options[destinoSelect.selectedIndex].text;
        const tipo = document.querySelector('input[name="tipo-donacion"]:checked').value;
        const mensaje = document.getElementById('mensaje').value.trim();

        let descripcion = `Donación ${tipo === 'unica' ? 'única' : 'mensual'} para ${destino}`;
        if (mensaje) {
            descripcion += ` - Mensaje: ${mensaje}`;
        }

        return descripcion;
    }

    function generarReferenciaPago() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `DON-${timestamp}-${random}`;
    }

    function obtenerSocioId() {
        return sessionStorage.getItem('socioId') || null;
    }

    // ============================================
    // MENSAJES Y UI
    // ============================================
    function mostrarMensaje(mensaje, tipo) {
        let container = document.querySelector('.message-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'message-container';
            donationForm.insertBefore(container, donationForm.firstChild);
        }

        container.innerHTML = `
            <div class="message message-${tipo}">
                ${tipo === 'error' ? '⚠️' : '✓'} ${mensaje}
            </div>
        `;

        setTimeout(() => {
            const msg = container.querySelector('.message');
            if (msg) {
                msg.style.opacity = '0';
                setTimeout(() => msg.remove(), 300);
            }
        }, 5000);
    }

    function mostrarMensajeExito(datos) {
        const container = document.querySelector('.message-container') || (() => {
            const el = document.createElement('div');
            el.className = 'message-container';
            donationForm.insertBefore(el, donationForm.firstChild);
            return el;
        })();

        container.innerHTML = `
            <div class="message message-success">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
                <h4 style="margin: 0 0 0.5rem 0;">¡Donación exitosa!</h4>
                <p style="margin: 0;">Gracias <strong>${datos.donante_nombre}</strong> por tu donación de <strong>$${datos.monto.toLocaleString('es-MX')} MXN</strong></p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; opacity: 0.8;">
                    Referencia: ${datos.referencia_pago}
                </p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem;">
                    Recibirás un correo de confirmación en <strong>${datos.donante_email}</strong>
                </p>
            </div>
        `;
    }

    function mostrarCargando(mostrar) {
        const submitBtn = donationForm.querySelector('button[type="submit"]');

        if (mostrar) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <span class="loader-inline"></span>
                Procesando donación...
            `;
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Donar $<span id="donateAmount">${selectedAmount.toLocaleString('es-MX')}</span> MXN`;
        }
    }

    // Inicializar resumen
    updateSummary();
});

// ============================================
// ESTILOS PARA MENSAJES Y VALIDACIÓN
// ============================================
const styles = document.createElement('style');
styles.textContent = `
    .message-container {
        margin-bottom: 1.5rem;
    }

    .message {
        padding: 1rem 1.25rem;
        border-radius: 8px;
        font-size: 0.9rem;
        transition: opacity 0.3s;
    }

    .message-error {
        background: #fee2e2;
        color: #dc2626;
        border: 1px solid #fecaca;
    }

    .message-success {
        background: #f9d1faff;
        color: #58065fff;
        border: 1px solid #f3a7e0ff;
        text-align: center;
    }

    .message-success h4 {
        color: #5f0d51;
        font-size: 1.1rem;
    }

    .loader-inline {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .amount-btn.selected {
        background: #5f0d51;
        color: white;
        border-color: #5f0d51;
        transform: scale(1.05);
    }

    /* Estilos de validación de tarjeta */
    .card-input-wrapper {
        position: relative;
    }

    .card-input-wrapper .form-input {
        padding-right: 50px;
    }

    .card-logo {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        width: 40px;
        height: 25px;
        display: none;
        align-items: center;
        justify-content: center;
    }

    .card-logo.active {
        display: flex;
    }

    .card-logo img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .form-input.valid {
        border-color: #22c55e;
    }

    .form-input.invalid {
        border-color: #ef4444;
    }

    .form-input.valid:focus {
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
    }

    .form-input.invalid:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .error-message {
        font-size: 12px;
        color: #ef4444;
        margin-top: 4px;
        display: none;
    }

    .error-message.active {
        display: block;
    }
`;
document.head.appendChild(styles);