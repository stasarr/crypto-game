document.addEventListener('DOMContentLoaded', () => {
    const correctSound = new Audio('/sounds/correct.mp3');
    correctSound.volume = 0.2;
    const incorrectSound = new Audio('/sounds/incorrect.mp3');
    incorrectSound.volume = 0.2;
    const levelupSound = new Audio('/sounds/levelup.mp3');
    levelupSound.volume = 0.2;
    const errorSound = new Audio('/sounds/error.mp3');
    errorSound.volume = 0.2;
    const lostSound = new Audio('/sounds/lostgame.mp3');
    lostSound.volume = 0.2;
    const jokerSound = new Audio('/sounds/joker.mp3');
    jokerSound.volume = 0.2;
    const inputs = document.querySelectorAll('.letter-input');
    const jokerButton = document.getElementById('jokerButton');
    const submitButton = document.getElementById('submitButton');
    let jokerCount = 3;
    let selectedInput = null;
    let mistakeCount = 0;
    const mistakeMap = new Map(); // Hangi inputta hata yapıldığını takip eder

    // 🔢 PUAN SİSTEMİ
    const baseScore = 100;
    let currentScore = 100;
    const scoreDisplay = document.getElementById('thisGameScore');

    function updateScoreDisplay() {
        scoreDisplay.innerHTML = `<strong>Seviye Puanı:</strong> ${currentScore}`;
    }    

    updateScoreDisplay();

    // Input geçişleri
    inputs.forEach((input, idx) => {
        input.addEventListener('focus', () => {
            input.select();
        });

        input.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const correctAnswer = input.dataset.answer.toLowerCase();

            if (value.match(/[a-zA-ZğüşıöçĞÜŞİÖÇ]/)) {
                if (value === correctAnswer) {
                    input.classList.remove('incorrect');
                    input.classList.add('correct');
                    correctSound.currentTime = 0; // Baştan başlat
                    correctSound.play();                
                } else {
                    input.classList.remove('correct');
                    input.classList.add('incorrect');
                    incorrectSound.currentTime = 0;
                    incorrectSound.play();                

                    // Bu input için daha önce hata sayılmamışsa bir kez say
                    if (!mistakeMap.has(idx)) {
                        mistakeCount++;
                        mistakeMap.set(idx, true);


                        // 🔻 YANLIŞ GİRİŞTE PUAN AZALT
                        currentScore -= 10;
                        updateScoreDisplay();

                        if (currentScore < 0 && Math.abs(currentScore) > totalScore) {
                            lostSound.currentTime = 0;
                            lostSound.play(); 

                            const gameLostModal = new bootstrap.Modal(document.getElementById('gameLostModal'));
                            gameLostModal.show();
                        
                            setTimeout(() => {
                                location.reload();
                            }, 3000);
                        }
                        
                        
                    }
                }

                if (idx + 1 < inputs.length) {
                    inputs[idx + 1].focus();
                }
            } else {
                input.value = '';
                input.classList.remove('correct', 'incorrect');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && input.value === '' && idx > 0) {
                inputs[idx - 1].focus();
            }
        });

        input.addEventListener('click', () => {
            if (selectedInput && selectedInput !== input) {
                selectedInput.classList.remove('joker-target');
            }
            selectedInput = input;
            input.classList.add('joker-target');
        });
    });

    // Joker sistemi
    jokerButton.addEventListener('click', () => {
        if (jokerCount > 0 && selectedInput) {
            const index = parseInt(selectedInput.dataset.index);
            const selectedChar = originalLetters[index].char.toLowerCase();

            // Bu harf zaten ipucu olarak verildiyse engelle
            const isClue = clueLetters.some(
                clue => clue.original.toLowerCase() === selectedChar
            );

            if (isClue) {
                errorSound.currentTime = 0;
                errorSound.play();  
                alert("Bu harf zaten ipucu olarak verildi!");
                
                return;
            }

            fetch(`/game/use-joker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        selectedInput.value = data.letter;
                        selectedInput.classList.add('correct');
                        selectedInput.disabled = true;
                        jokerCount--;
                        document.getElementById('jokerCount').textContent = jokerCount;
                        jokerSound.currentTime = 0;
                        jokerSound.play();  

                        // 🔻 JOKER PUAN DÜŞÜŞÜ
                        currentScore -= 25;
                        updateScoreDisplay();

                        if (currentScore < 0 && Math.abs(currentScore) > totalScore) {
                            lostSound.currentTime = 0;
                            lostSound.play(); 

                            const gameLostModal = new bootstrap.Modal(document.getElementById('gameLostModal'));
                            gameLostModal.show();
                        
                            setTimeout(() => {
                                location.reload();
                            }, 3000);
                        }
                    }
                });
        }
    });


    // Cevabı gönder
    submitButton.addEventListener('click', () => {
        const letters = Array.from(inputs).map(input => input.value);
        const usedJokers = 3 - parseInt(document.getElementById('jokerCount')?.textContent || "3");

        fetch('/game/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: letters,
                usedJokers,
                mistakes: mistakeCount // yanlış giriş sayısı burada
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const levelUpModel = new bootstrap.Modal(document.getElementById('levelUpModel'));
                    levelUpModel.show();
                    levelupSound.currentTime = 0;
                    levelupSound.play();   
                
                    setTimeout(() => {
                        location.reload();
                    }, 3000);
                    return;
                } else {
                    if (data.reason === "suspicion") {
                        const suspicionModal = new bootstrap.Modal(document.getElementById('suspicionModal'));
                        suspicionModal.show();
                        errorSound.currentTime = 0;
                        errorSound.play();   
                    
                        setTimeout(() => {
                            location.reload();
                        }, 3000);
                        return;
                    }
                    errorSound.currentTime = 0;
                    errorSound.play();   
                    alert("Bazı harfler yanlış. Lütfen tekrar deneyin.");
                    if (data.wrongIndices) {
                        data.wrongIndices.forEach(index => {
                            inputs[index].classList.remove('correct');
                            inputs[index].classList.add('incorrect');
                        });
                    }
                }
            });
    });
});
