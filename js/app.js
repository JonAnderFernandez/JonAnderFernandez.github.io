let notificationPermission = false;
let geolocationPermission = false;

let geolocationOpts = {
    enableHighAccuracy: true, 
    maximumAge        : 0, 
    timeout           : 5000
}

let map, view, graphicLayer, userGraphic;
let appConfig;
let mapDragged = false;

let userLocation = {};
let userPreviousLocation = {};
let pointsOfInterest = [];
let nearPointsOfInterest = [];

let inRangeS = false;
let shortRangeNotified = false;
let inRangeM = false;
let mediumRangeNotified = false;
let inRangeL = false;
let longRangeNotified = false;

let x = 0;
let y = 0;

// window.addEventListener('online', event => { console.log('ONLINE'); });

// window.addEventListener('offline', event => { console.log('OFFLINE'); });

// GET USERS LOCATION
navigator.geolocation.getCurrentPosition( position => {
    userLocation = {
        'latitude'  : position.coords.latitude,
        'longitude' : position.coords.longitude
    };
}, error => { console.log(error) }, geolocationOpts );
// CHECK GEOLOCATION PERMISSION
navigator.permissions.query({name:'geolocation'}).then( permissionStatus => {
    geolocationPermission = (permissionStatus.state === 'granted');
    // ADD GEOLOCATION PERMISSION CHANGE LISTENER
    permissionStatus.addEventListener('change', () => {        
        geolocationPermission = (permissionStatus.state === 'granted');
        checkAppPermissions();
    });
});
// CHECK NOTIFICATION PERMISSION
navigator.permissions.query({name:'notifications'}).then( permissionStatus => {
    notificationPermission = (permissionStatus.state === 'granted');
    if (permissionStatus.state !== 'denied') {
        Notification.requestPermission();
    } 
    // ADD NOTIFICATION PERMISSION CHANGE LISTENER
    permissionStatus.addEventListener('change', () => {
        notificationPermission = (permissionStatus.state === 'granted');
        checkAppPermissions();
    });
});
// ADD USER LOCATION WATCHER
navigator.geolocation.watchPosition( position => {
    userLocation = {
        'latitude'  : position.coords.latitude,
        'longitude' : position.coords.longitude
    };
    if(graphicLayer != undefined){
    //     userLayer.removeAll();  

        
        drawUserMarker(userLocation.longitude, userLocation.latitude);


        userPreviousLocation = userLocation;
        if(!mapDragged){        
            appConfig.activeView.center = [userLocation.longitude, userLocation.latitude];
        }

        checkPointsOfInterest();
    }
}, error => { console.log(error) }, geolocationOpts );

window.addEventListener('load', () => {
    // SERVICE WORKER REGISTRATION
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then( registration => console.log('SERVICE WORKER SUCCESFULLY REGISTERED')) 
            .catch( err => console.log('[!!!] FAILED TO REGISTER SERVICE WORKER'));
    };
    // APP PERMISSIONS CHECK
    checkAppPermissions();
    // LOAD MAP
    loadMap();

    document.getElementById('centerView').addEventListener('click', () => {
        appConfig.activeView.center = [userLocation.longitude, userLocation.latitude];
        mapDragged = false;
    });
    
    let routeSelector = document.getElementById('routeSelector');

    properties.kmlFiles.forEach(k => {
        let opt = `\n<option data-route='${k}'>${k.substring(0, k.length - 4).toUpperCase()}</option>`;
        routeSelector.innerHTML += opt;
        document.getElementById('routeSelector2').innerHTML += opt;
    });

    routeSelector.addEventListener('change', () => {
        document.getElementById('footer').style.display = 'block';
        document.getElementById('panelIniciarRuta').style.display = 'block';
        document.getElementById('btnDesplegable').style.display = 'none';
        loadKML(routeSelector.getElementsByTagName('option')[routeSelector.selectedIndex].getAttribute('data-route'));
    });

    document.getElementById('btnBuscar').addEventListener('click', () => {
        let opt = document.getElementById('routeSelector2').getElementsByTagName('option')[document.getElementById('routeSelector2').selectedIndex];
        if (document.getElementById('routeSelector2').selectedIndex != 0) {
            // document.getElementById('route-name').textContent = opt.textContent;
            loadKML(opt.getAttribute('data-route'));
        } else {
            document.getElementById('route-name').textContent = '';
        }
    });

    document.getElementById('removeRoutes').addEventListener('click', () => {
        document.getElementById('route-name').textContent = '';
        cleargraphicLayers();
        routeSelector.selectedIndex = 0;
    });

    document.getElementById('switch-btn').addEventListener('click', function () {
        let activeViewpoint = appConfig.activeView.viewpoint.clone();
        appConfig.activeView.container = null;
        if (appConfig.activeView.type === '3d') {
            appConfig.mapView.viewpoint = activeViewpoint;
            appConfig.mapView.container = appConfig.container;
            appConfig.activeView = appConfig.mapView;
            appConfig.sceneView.map.ground = [];
            this.value = '3D';
        } else {
            appConfig.sceneView.viewpoint = activeViewpoint;
            appConfig.sceneView.container = appConfig.container;
            appConfig.activeView = appConfig.sceneView;
            appConfig.sceneView.map.ground = 'world-elevation'
            this.value = '2D';
        }
    });
});

const loadMap = () => {
    require([ 'esri/Map', 'esri/views/MapView', 'esri/views/SceneView', 'esri/layers/GraphicsLayer' ], 
    (Map, MapView, SceneView, GraphicsLayer) => {
        map = new Map({
            basemap : 'gray-vector'
        });

        graphicLayer = new GraphicsLayer({
            elevationInfo: {
                mode: 'on-the-ground'
            }
        });
        
        map.add( graphicLayer );

        appConfig = {
            activeView : null,
            center     : [userLocation.longitude, userLocation.latitude],
            container  : 'viewDiv',
            mapView    : null,
            sceneView  : null,
            zoom       : 15
        };

        let initialViewParams = {
            zoom      : appConfig.zoom,
            center    : appConfig.center,
            container : appConfig.container
        };

        // create 2D view y lo iniciamos
        appConfig.mapView = new MapView(initialViewParams);
        appConfig.mapView.map = map;
        appConfig.activeView = appConfig.mapView;

        // create 3D view, sin iniciarlo
        initialViewParams.container = null;
        initialViewParams.map = map;
        appConfig.sceneView = new SceneView(initialViewParams);

        appConfig.activeView.ui.remove('zoom');
        appConfig.sceneView.ui.remove('zoom');

        appConfig.activeView.on('drag', () => { mapDragged = true; });
        appConfig.sceneView.on('drag', () => { mapDragged = true; });

        drawUserMarker(userLocation.longitude, userLocation.latitude);
    });
}

const loadKML = kmlFile => {
    require([ 'esri/Graphic' ], 
    Graphic => {
        cleargraphicLayers();
        if ('caches' in window) {
            caches.match('./kml/' + kmlFile).then( response => {
                if (response){
                    console.log('LOADING KML FILE: ' + kmlFile);
                    response.text().then(xml => {
                        let xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
                        let arrayPlacemarks = Array.from(xmlDoc.getElementsByTagName('Placemark'));

                        document.getElementById('route-name').textContent = xmlDoc.getElementsByTagName('name')[0].textContent.trim();

                        let arrayRoutes = arrayPlacemarks.filter(p => {
                            return p.getElementsByTagName('LineString').length != 0
                        });
                        arrayRoutes.forEach(route => {
                            let color = xmlDoc.querySelector(route.getElementsByTagName('styleUrl')[0].textContent.trim()).getElementsByTagName('LineStyle')[0].getElementsByTagName('color')[0].textContent.trim();
                            routeCoords = route.getElementsByTagName('coordinates')[0].textContent.trim().split('\n');
                            let coordsArray = [];
                            for (let coords of routeCoords) {
                                coordsArray.push(coords.split(','));
                            }

                            graphicLayer.add(new Graphic({
                                geometry : {
                                    paths : [coordsArray],
                                    type  : 'polyline', 
                                },
                                symbol   : {
                                    style : 'short-dash',
                                    color : color,
                                    type  : 'simple-line',
                                    width : 3,
                                },
                            }));
                        });        

                        let arrayPoints = arrayPlacemarks.filter(p => {
                            return p.getElementsByTagName('Point').length != 0
                        });
                        let i = 1;
                        pointsOfInterest = [];
                        pointsOfInterestCoords = [];
                        arrayPoints.forEach(point => {
                            pointCoords = point.getElementsByTagName('coordinates')[0].textContent.trim().split(',');    
                            pointsOfInterestCoords.push(pointCoords);
                            pointsOfInterest.push({
                                id          : i++,
                                coordinates : pointCoords,
                                name        : point.getElementsByTagName('name')[0].textContent,
                                description : point.getElementsByTagName('description')[0].textContent,
                                type 		: point.getElementsByTagName('type')[0].textContent
                            });


	                        pointsGraphic = new Graphic({
	                            geometry : {
	                                longitude : pointCoords[0],
	                                latitude  : pointCoords[1],
	                                type      : 'point'
	                            },
	                            symbol   : {
	                                height  : '16px',
	                                type    : 'picture-marker',
	                                url     : properties.icons[point.getElementsByTagName('type')[0].textContent],
	                                width   : '16px',
	                                yoffset : '8px'
	                            }
	                        });


	                        graphicLayer.add(pointsGraphic);
                        });


                        checkPointsOfInterest();
                    });
                }
            });   
        }
    });
}

const checkPointsOfInterest = () => {
    nearPointsOfInterest = pointsOfInterest.filter( p => {
        return (calculateDistance(userLocation, {
            'longitude' : p.coordinates[0],
            'latitude'  : p.coordinates[1],
        }) < properties.longDistance)
    });
    notifyPointsOfInterest();
}

const notifyPointsOfInterest = () => {
    if(nearPointsOfInterest.length > 0){
        let approchingPoints = nearPointsOfInterest.filter( p => {
            let point = {
                'longitude' : p.coordinates[0],
                'latitude'  : p.coordinates[1],
            };
            return calculateDistance(userPreviousLocation, point) >= calculateDistance(userLocation, point);
        });

        if(approchingPoints.length > 0){
            let distanceToPoints = [];
            approchingPoints.forEach( p => {
                distanceToPoints.push(
                    calculateDistance(userLocation, {
                        'longitude' : p.coordinates[0],
                        'latitude'  : p.coordinates[1],
                    })
                );
            });
        
            let minDistance = Math.min(...distanceToPoints);

            inRangeS = (0 < minDistance && minDistance <= properties.shortDistance);
            inRangeM = (properties.shortDistance < minDistance && minDistance <= properties.mediumDistance);
            inRangeL = (properties.mediumDistance < minDistance && minDistance <= properties.longDistance);

//            if (0 < minDistance && minDistance <= properties.shortDistance){
//                inRangeS = true;
//                inRangeM = false;
//                inRangeL = false;
//            } else if (properties.shortDistance < minDistance && minDistance <= properties.mediumDistance){
//                inRangeS = false;
//                inRangeM = true;
//                inRangeL = false;
//            } else if (properties.mediumDistance < minDistance && minDistance <= properties.longDistance){
//                inRangeS = false;
//                inRangeM = false;
//                inRangeL = true;
//            } else {
//                inRangeS, shortRangeNotified = false;
//                inRangeM, mediumRangeNotified = false;
//                inRangeL, longRangeNotified = false;
//            }

            console.log(`IN SHORT RANGE: ${inRangeS} | NOTIFIED? ${shortRangeNotified}`);
            console.log(`IN MEDIUM RANGE: ${inRangeM} | NOTIFIED? ${mediumRangeNotified}`);
            console.log(`IN LONG RANGE: ${inRangeL} | NOTIFIED? ${longRangeNotified}`);

            if ('Notification' in window) {
                if (Notification.permission !== 'denied') {
                    Notification.requestPermission();
                } 

                if (Notification.permission === 'granted') {
                    let nearerPoint = approchingPoints.filter( p => {
                        return calculateDistance(userLocation, {
                            'longitude' : p.coordinates[0],
                            'latitude'  : p.coordinates[1]
                        }) == minDistance;
                    });

                    let approchingPointsStr = `${nearerPoint[0].description}`;
                    approchingPoints.forEach( p => {
                        if(p.id != nearerPoint[0].id){
                            approchingPointsStr += `\n'${p.name}' a ${
                                calculateDistance(userLocation, {
                                    'longitude' : p.coordinates[0],
                                    'latitude'  : p.coordinates[1]
                                }).toFixed(2)
                            } m`;
                        }
                    });

                    let options = {
                        body: `${approchingPointsStr}`,
                        // icon: '../assets/512x512.svg'
                        silent: true
                    }

            		let snd;                     
                    if (inRangeS && !shortRangeNotified){
                        new Notification(`'${nearerPoint[0].name.toUpperCase()}' A ${minDistance.toFixed(2)} METROS`, options);
            		    snd = (nearerPoint[0].type === 'warning') ? new Audio('/audio/warning100m.mp3') : new Audio('/audio/100m.mp3');
                        shortRangeNotified = true;
                        mediumRangeNotified = false
                        longRangeNotified = false
                    } else if (inRangeM && !mediumRangeNotified){
                        new Notification(`'${nearerPoint[0].name.toUpperCase()}' A ${minDistance.toFixed(2)} METROS`, options);
            		    snd = (nearerPoint[0].type === 'warning') ? new Audio('/audio/warning200m.mp3') : new Audio('/audio/200m.mp3');
                        shortRangeNotified = false;
                        mediumRangeNotified = true;
                        longRangeNotified = false;
                    } else if (inRangeL && !longRangeNotified){
                        new Notification(`'${nearerPoint[0].name.toUpperCase()}' A ${minDistance.toFixed(2)} METROS`, options);
            		    snd = (nearerPoint[0].type === 'warning') ? new Audio('/audio/warning300m.mp3') : new Audio('/audio/300m.mp3');
                        shortRangeNotified = false;
                        mediumRangeNotified = false;
                        longRangeNotified = true;
                    } 
                    if(snd != undefined){
	            		snd.play();
                    }
                } 
            }
        } else {
            inRangeS, shortRangeNotified = false;
            inRangeM, mediumRangeNotified = false;
            inRangeL, longRangeNotified = false;
        }
    }
}

const checkAppPermissions = () => {
    document.getElementById('grantPermissions').style.display = (notificationPermission && geolocationPermission) ? 'none' : 'flex';
}

const drawUserMarker = (long, lat) => {
    require([ 'esri/Graphic' ], 
    Graphic => {
        graphicLayer.graphics.remove(userGraphic);

        userGraphic = new Graphic({
            geometry : {
                longitude : long,
                latitude  : lat,
                type      : 'point'
            },
            symbol   : {
                height  : '32px',
                type    : 'picture-marker',
                url     : properties.icons['user'],
                width   : '32px',
                yoffset : '16px'
            }
        });

        graphicLayer.add(userGraphic);
    });
};

const cleargraphicLayers = () => {
    graphicLayer.removeAll();
    graphicLayer.add(userGraphic);
    pointsOfInterest = [];
    inRangeS, shortRangeNotified = false;
    inRangeM, mediumRangeNotified = false;
    inRangeL, longRangeNotified = false;
}

const degreesToRadians = degrees => {
  return degrees * Math.PI / 180;
}

const calculateDistance = (coords1, coords2) => {
    let dLat = degreesToRadians(coords2.latitude - coords1.latitude);
    let dLon = degreesToRadians(coords2.longitude - coords1.longitude);
    let a = Math.sin(dLat/2) * Math.sin(dLat/2) 
        + Math.sin(dLon/2) * Math.sin(dLon/2) 
        * Math.cos(degreesToRadians(coords1.latitude)) * Math.cos(degreesToRadians(coords2.latitude)); 
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    
    /* POR TENER UN DATO */
    let distanceKM = 6371 * c;
    distanceKM = distanceKM.toFixed(2);
    document.getElementById('distancia').innerHTML = distanceKM + 'km';
      
    return (6371 * c) * 1000; // earthRadiusKm = 6371
}