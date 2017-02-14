function deg2rad (angle) {
    return angle * 0.017453292519943295;
};

function Blinken (src) {
    this.consoleEnabled = true;
    this.cube = true;
    this.mWidth = 32;
    this.mHeight = 18;
    this.rotate = false;
    this.rotateSpeed = 5;
    this.helpersEnabled = true;
    this.gridEnabled = false;
    this.src = src;
    this.loop = this.render.bind(this);
    this.matrix = [];
    this.linearMatrix = [];
    this.frames = 0;
    this.fpsElement = document.getElementById('fps');
    this.numFramesToAverage = 16;
    this.frameTimeHistory = [];
    this.frameTimeIndex = 0;
    this.totalTimeForFrames = 0;
    this.probe = false;
    this.ref = [];
    this.mode = 0; // 0: scaled full input, 1: first row, 2: last row, 3: left col, 4: right col;
    this.bounds = {
        togglePixelMode: this.togglePixelMode.bind(this),
        toggleRotate: this.toggleRotate.bind(this),
        addRow: this.addRow.bind(this),
        removeRow: this.removeRow.bind(this),
        addCol: this.addCol.bind(this),
        removeCol: this.removeCol.bind(this),
        drawMode: this.drawMode.bind(this)
    }
    this.init();
}

/*
██ ███    ██ ██ ████████
██ ████   ██ ██    ██
██ ██ ██  ██ ██    ██
██ ██  ██ ██ ██    ██
██ ██   ████ ██    ██
*/

Blinken.prototype.init = function () {
    if (this.consoleEnabled) {
        $('#console').addClass('on');
    }

    $(document).on('click', '[gui-action=togglePixelMode]', this.bounds.togglePixelMode);
    $(document).on('click', '[gui-action=toggleRotate]', this.bounds.toggleRotate);
    $(document).on('click', '[gui-action=addRow]', this.bounds.addRow);
    $(document).on('click', '[gui-action=removeRow]', this.bounds.removeRow);
    $(document).on('click', '[gui-action=addCol]', this.bounds.addCol);
    $(document).on('click', '[gui-action=removeCol]', this.bounds.removeCol);
    $(document).on('change', '[gui-action=drawMode]', this.bounds.drawMode);

    this.conGeometries = document.getElementById('con-geometries');
    this.conRows = document.getElementById('con-rows');
    this.conCols = document.getElementById('con-cols');
    this.conCalls = document.getElementById('con-calls');
    this.conFaces = document.getElementById('con-faces');
    this.conVerts = document.getElementById('con-verts');

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    this.renderer.setClearColor( 0xf0f0f0, 1);
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( this.renderer.domElement );
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

    this.addObject(new THREE.AmbientLight(0x909090));

    var that = this;

    this.src.addEventListener('play', this.updateV.bind(this), true);

    window.addEventListener('resize', function() {
      var w = window.innerWidth,
          h = window.innerHeight;
      that.renderer.setSize(w, h);
      that.camera.aspect = w / h;
      that.camera.updateProjectionMatrix();
    });
    this.then = Date.now() / 1000;
    this.populate();
    this.start();
};

Blinken.prototype.addObject = function (obj) {
    this.ref.push(obj);
    this.scene.add(obj);
}

/*
██████  ███████ ███    ██ ██████  ███████ ██████
██   ██ ██      ████   ██ ██   ██ ██      ██   ██
██████  █████   ██ ██  ██ ██   ██ █████   ██████
██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
██   ██ ███████ ██   ████ ██████  ███████ ██   ██
*/

Blinken.prototype.render = function () {
    if (this.shouldReturn) {
        this.shouldReturn = false;
        this.running = false;
        return;
    }
    this.frames++;
    this.push(this.readVidElement());
    if (this.rotate) {
        this.dots.rotation.y += this.rotateSpeed * .001;
    }
    requestAnimationFrame( this.loop );
    this.renderer.render( this.scene, this.camera );

    this.console();
};

Blinken.prototype.stop = function () {
    this.shouldReturn = true;
};

Blinken.prototype.start = function () {
    this.shouldReturn = false;
    if (!this.running) {
        this.running = true;
        requestAnimationFrame( this.loop );
    }
};

Blinken.prototype.updateV = function () {
    console.info('updateV');
    this.src.width = $('#v').width();
    this.src.height = $('#v').height();
};

Blinken.prototype.populate = function () {

    var boardGeometry = new THREE.BoxGeometry( this.mWidth + 1, this.mHeight + 1, 1);
    var boardMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        side: THREE.DoubleSide
    });
    var board = new THREE.Mesh(boardGeometry, boardMat);

    var geometry;
    var geometry = this.cube ? new THREE.BoxGeometry( .92, .92, .92 ) : new THREE.SphereGeometry( .2, 32, 32 ) ;
    board.position.set( .5, -.5, this.cube ? -.1 : -.5 );

    this.dotGroup = new THREE.Group();
    for (var y = 1; y <= this.mHeight; y++) {
        this.matrix[y] = [];
        for (var x = 1; x <= this.mWidth; x++) {
            var dot = new THREE.Mesh(geometry, this.baseMaterial());

            dot.position.x = x;
            dot.position.y = -y;

            this.dotGroup.add(dot);
            this.matrix[y][x] = dot;
            this.linearMatrix.push(dot);
        }
    }
    this.dotGroup.position.x += this.mWidth * -.5;
    this.dotGroup.position.y += this.mHeight * .5;
    this.dots = new THREE.Group();
    this.dots.add(this.dotGroup);
    this.dots.add(board);

    this.addObject( this.dots );

    if (this.helpersEnabled) {
        this.axis = new THREE.AxisHelper(4);
        this.axis.position.x = (-this.mWidth * .5) - 1;
        this.axis.position.y = (-this.mHeight * .5) - 2;
        this.axis.position.z = -1.5;
        this.dots.add(this.axis);

        if (this.gridEnabled) {
            this.gridHelper = new THREE.GridHelper( Math.max(this.mWidth, this.mHeight) + 10, Math.max(this.mWidth, this.mHeight) + 10, 0xdddddd, 0xdddddd );
            this.gridHelper.position.z = - 4;
            this.gridHelper.rotation.x = deg2rad(-90);
            this.addObject( this.gridHelper );
        }
    }

    this.conRows.textContent = this.mHeight;
    this.conCols.textContent = this.mWidth;

    this.camera.position.z = Math.max(this.mWidth, this.mHeight) + 10;
};

Blinken.prototype.baseMaterial = function() {
    return new THREE.MeshStandardMaterial( { color: 0x222222 } );
};

Blinken.prototype.setDot = function (y, x, on) {
    this.matrix[y][x].material.color = on ? new THREE.Color(0xeeeeee) : new THREE.Color(0x222222);
};

Blinken.prototype.setDotColor = function (y, x, color) {
    this.linearMatrix[i].material.emissive = new THREE.Color(color);
};

/*
 ██████  ██    ██ ██
██       ██    ██ ██
██   ███ ██    ██ ██
██    ██ ██    ██ ██
 ██████   ██████  ██
*/

Blinken.prototype.togglePixelMode = function () {
    this.cleanup();
    this.cube = !this.cube;
    this.populate();
    this.start();
};

Blinken.prototype.drawMode = function (e) {
    var m = $('#drawMode').val();
    if (m === '') {
        return;
    }
    console.log(m);
    console.log(parseInt(m));
    this.mode = parseInt(m);
};

Blinken.prototype.addRow = function () {
    this.cleanup();
    this.mHeight++;
    this.populate();
    this.start();
};
Blinken.prototype.removeRow = function () {
    this.cleanup();
    if (this.mHeight > 1) {
        this.mHeight--;
    }
    this.populate();
    this.start();
};
Blinken.prototype.addCol = function () {
    this.cleanup();
    this.mWidth++;
    this.populate();
    this.start();
};
Blinken.prototype.removeCol = function () {
    this.cleanup();
    if (this.mWidth > 1) {
        this.mWidth--;
    }
    this.populate();
    this.start();
};

Blinken.prototype.toggleRotate = function () {
    this.rotate = !this.rotate;
};

Blinken.prototype.cleanup = function () {
    this.matrix = [];
    this.linearMatrix = [];
    this.frames = 0;
    var that = this;
    for (var i = 0; i < this.ref.length; i++) {
        this.scene.remove(this.ref[i]);
        if (this.ref[i].traverse) {
            this.ref[i].traverse(function(o){
                that.dealloc(o);
            });
        }
    }
};

Blinken.prototype.dealloc = function (obj) {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
    if (obj.texture) obj.texture.dispose();
};

/*
██████  ███████ ██████  ██    ██  ██████
██   ██ ██      ██   ██ ██    ██ ██
██   ██ █████   ██████  ██    ██ ██   ███
██   ██ ██      ██   ██ ██    ██ ██    ██
██████  ███████ ██████   ██████   ██████
*/

Blinken.prototype.console = function () {
    if (!this.consoleEnabled) return;
    this.countFps();
    if (this.frames % 30 == 0) {
        this.conGeometries.textContent = this.renderer.info.memory.geometries;
        this.conCalls.textContent = this.renderer.info.render.calls;
        this.conFaces.textContent = this.renderer.info.render.faces;
        this.conVerts.textContent = this.renderer.info.render.vertices;
    }
};

Blinken.prototype.countFps = function () {
    this.now = Date.now() / 1000;
    var elapsed = this.now - this.then;
    this.then = this.now;
    this.totalTimeForFrames += elapsed - (this.frameTimeHistory[this.frameTimeIndex] || 0);
    this.frameTimeHistory[this.frameTimeIndex] = elapsed;
    this.frameTimeIndex = (this.frameTimeIndex + 1) % this.numFramesToAverage;
    var averageElapsedTime = this.totalTimeForFrames / this.numFramesToAverage;
    var fps = 1 / averageElapsedTime;
    this.fpsElement.innerText = fps.toFixed(0);
};

Blinken.prototype.readVidElement = function () {
    var src = this.src;
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    c.width = this.mWidth;
    c.height = this.mHeight;

    // 0: full input scaled, 1: top, 2: bottom, 3: left, 4: right;
    if (this.mode === 0) {
        ctx.drawImage(src, 0, 0, c.width, c.height);
    } else if (this.mode === 1) {
        ctx.drawImage(src, 0, 0, c.width, src.height);
    } else if (this.mode === 2) {
        ctx.drawImage(src, 0, -(src.height - this.mHeight), c.width, src.height);
    } else if (this.mode === 3) {
        ctx.drawImage(src, 0, 0, src.width, c.height);
    } else if (this.mode === 4) {
        ctx.drawImage(src, -(src.width - this.mWidth), 0, src.width, c.height);
    }

    var data = [];
    for (var y = 0; y < c.height; y++) {
        for (var x = 0; x < c.width; x++) {
            var pData = ctx.getImageData(x, y, 1, 1).data;
            data.push('rgb(' + pData[0] + ',' + pData[1] + ',' + pData[2] + ')');
        }
    }
    return data;
};

Blinken.prototype.probeStream = function (data) {
    this.probe = true;
};

Blinken.prototype.push = function (data) {
    var self = this;
    if (this.probe) {
        console.info('stream probe',data);
        this.probe = false;
    }
    for (var i = 0; i < data.length; i++) {
        if (this.linearMatrix[i]) {
            this.linearMatrix[i].material.emissive = new THREE.Color(data[i]);
        }
    }

};

/*
██████  ██████   █████   ██████         ██        ██████  ██████   ██████  ██████
██   ██ ██   ██ ██   ██ ██              ██        ██   ██ ██   ██ ██    ██ ██   ██
██   ██ ██████  ███████ ██   ███     ████████     ██   ██ ██████  ██    ██ ██████
██   ██ ██   ██ ██   ██ ██    ██     ██  ██       ██   ██ ██   ██ ██    ██ ██
██████  ██   ██ ██   ██  ██████      ██████       ██████  ██   ██  ██████  ██
*/

function is_touch_device() {
  return 'ontouchstart' in window        // works on most browsers
      || navigator.maxTouchPoints;       // works on IE10/11 and Surface
};

function dropZone( imgCallback ) {
    var dropzone = document.createElement( 'div' );
    dropzone.className = 'dropzone';
    dropzone.textContent = 'drop video here';
    dropzone.addEventListener('dragenter', function(event){
        this.style.backgroundColor = 'rgba( 255,255,255,.4 )';
    }, true );
    dropzone.addEventListener('dragleave', function(event){
        $(this).removeClass('over');
        this.style.backgroundColor = 'transparent';
    }, true );
    dropzone.addEventListener('dragover', function(event) {
        $(this).addClass('over');
        this.style.backgroundColor = 'rgba( 255,255,255,.4 )';
        event.preventDefault();
    }, true);
    dropzone.addEventListener('drop', function(event) {
        $(this).removeClass('over');
        this.style.backgroundColor = 'transparent';
        event.preventDefault();
        var allTheFiles = event.dataTransfer.files;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var video = document.getElementById('v');
                video.pause();
                $('#v').empty();
                var source = document.createElement('source');
                source.setAttribute('src', e.currentTarget.result);
                video.appendChild(source);
                video.load();
                video.play();
            } catch( e ) {
                console.log(e);
            }
        };
        reader.readAsDataURL( allTheFiles[ 0 ] );
    }, true);
    return dropzone;
}
