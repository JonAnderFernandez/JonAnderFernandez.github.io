var panelBusqueda;

$(function () {
    var content = document.getElementById('panelDeslizante');

    var btn3D = document.getElementById('infoDiv');
    var btnVolumen = document.getElementById('activarVoz');
    var viewDiv = document.getElementById('viewDiv');
    var footer = document.getElementById('footer');
    var panelIniciarRuta = document.getElementById('panelIniciarRuta');
    var panelDesplegable = document.getElementById('btnDesplegable');
    var btnHelp = document.getElementById('btnHelp');

    seccionDesplegable();
    seccionAyuda();
    panelSlider();

    document.getElementById('back-btn').addEventListener('click', event => {
        mostrarOcultarPaneles(false);
    });

    document.getElementById('btnBuscar').addEventListener('click', event => {
        mostrarOcultarPaneles(true);
        footer.style.display = "block";
    });

    $('button.find-location, .menu-btn').on('click', function () {
        mostrarOcultarPaneles(true);
        // $('.input-page-wrapper').hide();
        // $('.seccionAyuda').hide();
        // $('#viewDiv,.app-bar').show();
        // btn3D.style.display = "block";
        
        // getUserLocation();
    });

    document.getElementById('btnIniciar').addEventListener('click', event => {
        content.style.display = "none";
        panelIniciarRuta.style.display = "none";
        panelDesplegable.style.display = "block";
    });

    document.getElementById('menu-nav-btn').addEventListener('click', event => {
        if (content.style.display === "none") {
            content.style.display = "block";
            //panelBusqueda.close();
        } else {
            content.style.display = "none";
        }
    });

    document.getElementById('activarVoz').addEventListener('click', function () {
        //var icon = document.getElementById('fa-volume');
        $('#fa-volume').toggleClass('fas fa-volume-up').toggleClass('fas fa-volume-mute');
    })

    function mostrarOcultarPaneles(mostrar) {
        if (!mostrar) {
            $('.input-page-wrapper').show();
            $('.app-bar').hide();
            $('#menu-nav-btn').show();
            $('.seccionAyuda').hide();
            viewDiv.style.display = "none";
            content.style.display = "none";
            btn3D.style.display = "none";
            footer.style.display = "none";
            btnVolumen.style.display = "none";
            $('.seccionToggle').slideUp();
        } else {
            $('.input-page-wrapper').hide();
            $('#viewDiv,.app-bar').show();
            btn3D.style.display = "block";
            btnVolumen.style.display = "block";
            // footer.style.display = "block";
            panelIniciarRuta.style.display = "block";
            panelDesplegable.style.display = "none";
            $('.seccionAyuda').hide();
        }

    }

    function seccionDesplegable() {
        var estado = false;
        $('#btn-toggle').on('click', function () {
            $('.seccionToggle').slideToggle();
            $('#fa-caret').toggleClass('fas fa-caret-up').toggleClass('fas fa-caret-down');
            if (estado == true) {
                //	$(this).text("Abrir");
                $('body').css({
                    "overflow": "auto"
                });
                estado = false;
                btn3D.style.display = "block";
                btnVolumen.style.display = "block";
                $('#viewDiv,.app-bar').show();
            } else {
                //	$(this).text("Cerrar");
                $('body').css({
                    "overflow": "hidden"
                });
                estado = true;
                btn3D.style.display = "none";
                btnVolumen.style.display = "none";
                $('#viewDiv,.app-bar').hide();
            }
        });
    }

    function seccionAyuda() {

        //SECCION AYUDA
        var current_fs, next_fs, previous_fs; //fieldsets
        var left, opacity, scale; //fieldset properties 
        var animating;

        btnHelp.addEventListener('click', event => {
            // alert("click")
            $('.input-page-wrapper').hide();
            $('.app-bar').show();
            $('.seccionAyuda').show();
            $('.route-name').hide();
            $('#menu-nav-btn').hide();

        });

        $(".next").click(function () {
            if (animating) return false;
            animating = true;

            current_fs = $(this).parent();
            next_fs = $(this).parent().next();

            //activate next step on progressbar using the index of next_fs
            $("#progressbar li").eq($("fieldset").index(next_fs)).addClass("active");

            //show the next fieldset
            next_fs.show();
            //hide the current fieldset with style
            current_fs.animate({ opacity: 0 }, {
                step: function (now, mx) {
                    //as the opacity of current_fs reduces to 0 - stored in "now"
                    //1. scale current_fs down to 80%
                    scale = 1 - (1 - now) * 0.2;
                    //2. bring next_fs from the right(50%)
                    left = (now * 50) + "%";
                    //3. increase opacity of next_fs to 1 as it moves in
                    opacity = 1 - now;
                    current_fs.css({
                        'transform': 'scale(' + scale + ')',
                        'position': 'absolute'
                    });
                    next_fs.css({ 'left': left, 'opacity': opacity });
                },
                duration: 800,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                //this comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        });

        $(".previous").click(function () {
            if (animating) return false;
            animating = true;

            current_fs = $(this).parent();
            previous_fs = $(this).parent().prev();

            //de-activate current step on progressbar
            $("#progressbar li").eq($("fieldset").index(current_fs)).removeClass("active");

            //show the previous fieldset
            previous_fs.show();
            //hide the current fieldset with style
            current_fs.animate({ opacity: 0 }, {
                step: function (now, mx) {
                    //as the opacity of current_fs reduces to 0 - stored in "now"
                    //1. scale previous_fs from 80% to 100%
                    scale = 0.8 + (1 - now) * 0.2;
                    //2. take current_fs to the right(50%) - from 0%
                    left = ((1 - now) * 50) + "%";
                    //3. increase opacity of previous_fs to 1 as it moves in
                    opacity = 1 - now;
                    current_fs.css({ 'left': left });
                    previous_fs.css({ 'transform': 'scale(' + scale + ')', 'opacity': opacity });
                },
                duration: 800,
                complete: function () {
                    current_fs.hide();
                    animating = false;
                },
                //this comes from the custom easing plugin
                easing: 'easeInOutBack'
            });
        });

        $(".submit").click(function () {
            return false;
        })
    }

    function panelSlider() {
        let block = document.querySelector(".block-1"),
            block2 = document.querySelector(".block-2"),
            slider = document.querySelector(".slider");

        slider.onmousedown = function dragMouseDown(e) {
            // posicion del mouse
            let dragX = e.clientY;
            // movimiento del mouse
            document.onmousemove = function onMouseMove(e) {
                // e.clientY será la posición del mouse ya que se ha movido un poco ahora
                // offsetHeight es la altura del bloque-1
                if (block.style.height != "340px") {
                    block.style.height = block.offsetHeight + e.clientY - dragX + "px";
                    block2.style.height = window.innerHeight - dragX + "px";
                }
                // actualizar la variable
                dragX = e.clientY;
            }
            document.onmouseup = () => document.onmousemove = document.onmouseup = null;
        }
        mobiledrag();
        function mobiledrag() {
            let block = document.querySelector(".block-1"),
                block2 = document.querySelector(".block-2"),
                slider = document.querySelector(".slider");
            // at least 100 px are a swipe
            // you can use the value relative to screen size: window.innerWidth * .1
            const offset = 100;
            let xDown, yDown;

            slider.addEventListener('touchstart', e => {
                const firstTouch = getTouch(e);
                xDown = firstTouch.clientX;
                yDown = firstTouch.clientY;
            });

            slider.addEventListener('touchend', e => {
                if (!xDown || !yDown) {
                    return;
                }

                const {
                    clientX: xUp,
                    clientY: yUp
                } = getTouch(e);
                const xDiff = xDown - xUp;
                const yDiff = yDown - yUp;
                const xDiffAbs = Math.abs(xDown - xUp);
                const yDiffAbs = Math.abs(yDown - yUp);

                // at least <offset> are a swipe
                if (Math.max(xDiffAbs, yDiffAbs) < offset) {
                    return;
                }

                if (xDiffAbs > yDiffAbs) {
                    if (xDiff > 0) {
                        console.log('left');
                    } else {
                        console.log('right');
                    }
                } else {
                    if (yDiff > 0) {
                        console.log('up');
                        block2.style.height = (window.innerHeight * 0.60) + "px";
                        block.style.height = (window.innerHeight * 0.40) + "px";

                    } else {
                        console.log('down');
                        block.style.height = (window.innerHeight * 0.96) + "px";
                        block2.style.height = (window.innerHeight * 0.04) + "px";
                    }
                }
            });

            function getTouch(e) {
                return e.changedTouches[0]
            }
        }
    }
});