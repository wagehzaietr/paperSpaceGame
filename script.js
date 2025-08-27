// Space Shooter Game - JavaScript Implementation
class SpaceShooter {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Game state
    this.gameState = "menu"; // menu, mapSelection, playing, paused, gameOver, upgrade
    this.score = 0;
    this.level = 1;
    this.lives = 30;
    this.gameRunning = false;

    // Round and Boss system
    this.currentRound = 1;
    this.roundEnemiesKilled = 0;
    this.roundEnemiesNeeded = 25; // Enemies to kill before boss
    this.bossActive = false;
    this.currentBoss = null;
    this.roundInProgress = false;

    // Ship upgrade system
    this.shipUpgrades = {
      damage: 0, // Max 5 levels - increases bullet damage
      health: 0, // Max 5 levels - increases player health
      speed: 0, // Max 5 levels - increases movement speed
      firerate: 0, // Max 5 levels - reduces shooting cooldown
      homing: 0, // Max 3 levels - adds homing bullet capability
      spread: 0, // Max 3 levels - adds spread shot capability
    };

    // Boss types configuration
    this.bossTypes = {
      destroyer: {
        name: "PLASMA DESTROYER",
        health: 120,
        width: 184,
        height: 184,
        speed: 7.5,
        damage: 2,
        shootCooldown: 2500,
        specialAttackCooldown: 7000,
        sprite: "firstboss",
        bulletSprite: "firstbossbullet",
        sound: "secondBossSound",
      },
      cruiser: {
        name: "BATTLE CRUISER",
        health: 120, // same as destroyer
        width: 184,
        height: 184, // same as destroyer
        speed: 7.5, // same as destroyer
        damage: 3,
        shootCooldown: 2200,
        specialAttackCooldown: 6000,
        sprite: "secondboss",
        bulletSprite: "secondbossbullet",
        sound: "firstBossSound",
      },
      mothership: {
        name: "ALIEN MOTHERSHIP",
        health: 120, // same as destroyer
        width: 184,
        height: 184, // same as destroyer
        speed: 7.5, // same as destroyer
        damage: 4,
        shootCooldown: 2000,
        specialAttackCooldown: 5000,
        sprite: "secondboss", // Use second boss but larger
        bulletSprite: "secondbossbullet",
        sound: "firstBossSound",
      },
    };

    // Map system
    this.selectedMap = "space"; // default map
    this.maps = {
      space: {
        name: "Deep Space",
        background: "assets/images/background.png",
        difficulty: "easy",
        description: "Classic space battlefield with asteroid fields",
        enemySpawnRate: 2000,
        speedMultiplier: 1.0,
        scoreMultiplier: 1.0,
        unlocked: true,
      },
      nebula: {
        name: "Cosmic Nebula",
        background: "maps/background1.jpeg",
        difficulty: "medium",
        description: "Navigate through colorful cosmic clouds",
        enemySpawnRate: 1700,
        speedMultiplier: 1.2,
        scoreMultiplier: 1.5,
        unlocked: true,
      },
      galaxy: {
        name: "Galactic Core",
        background: "maps/background2.png",
        difficulty: "hard",
        description: "Battle in the heart of the galaxy",
        enemySpawnRate: 1400,
        speedMultiplier: 1.5,
        scoreMultiplier: 2.0,
        unlocked: true,
      },
    };

    // Map scores tracking
    this.mapScores = {
      space: parseInt(localStorage.getItem("spaceScore") || "0"),
      nebula: parseInt(localStorage.getItem("nebulaScore") || "0"),
      galaxy: parseInt(localStorage.getItem("galaxyScore") || "0"),
    };

    // Canvas setup - fullscreen
    this.resizeCanvas();

    // Ensure crisp pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Game objects
    this.player = null;
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.explosions = [];

    // Input handling
    this.keys = {};
    this.mouseDown = false;
    this.lastShot = 0;
    this.shootCooldown = 200; // milliseconds
    
    // Touch controls state
    this.touchControls = null;
    
    // Scale factor for responsive design
    this.scaleFactor = 1;

    // Power-ups state
    this.powerUpStates = {
      rapidFire: { active: false, timeLeft: 0, duration: 10000 },
      shield: { active: false, timeLeft: 0, duration: 15000 },
      extraDamage: { active: false, timeLeft: 0, duration: 12000 },
    };

    // Enemy spawning
    this.lastEnemySpawn = 0;
    this.enemySpawnRate = 2000;
    
    // Anomaly enemy system
    this.lastAnomalySpawn = 0;
    this.anomalySpawnRate = 30000; // 30 seconds base rate
    this.anomalyChance = 0.15; // 15% chance when timer expires
    this.hitEffects = []; // Track hit effect animations

    // Background
    this.backgroundY = 0;
    this.backgroundSpeed = 1;

    // Audio
    this.backgroundMusic = document.getElementById("backgroundMusic");
    this.shootSound = document.getElementById("shootSound");
    this.popSound = document.getElementById("popSound");
    this.firstBossSound = document.getElementById("firstBossSound");
    this.enemyBullet = document.getElementById("enemyBullet");
    this.secondBossSound = document.getElementById("secondBossSound");
    this.bossIntroMusic = document.getElementById("bossIntroMusic");
    this.powerupSound = document.getElementById("powerupSound");
    this.chargeshotSound = document.getElementById("chargeshotSound");
    this.secretEnemySound = document.getElementById("secretEnemySound");
    this.audioEnabled = true;
    
    // Audio volume settings
    this.musicVolume = 1.0;
    this.sfxVolume = 1.0;
    
    // Load saved audio settings
    this.loadAudioSettings();
    
    // Initialize audio volumes
    if (this.backgroundMusic) this.backgroundMusic.volume = this.musicVolume;
    if (this.bossIntroMusic) this.bossIntroMusic.volume = this.musicVolume;
    if (this.firstBossSound) this.firstBossSound.volume = this.musicVolume;
    if (this.secondBossSound) this.secondBossSound.volume = this.musicVolume;
    
    // Initialize sound effect volumes
    if (this.shootSound) this.shootSound.volume = this.sfxVolume;
    if (this.popSound) this.popSound.volume = this.sfxVolume;
    if (this.enemyBullet) this.enemyBullet.volume = this.sfxVolume;
    if (this.powerupSound) this.powerupSound.volume = this.sfxVolume;
    if (this.chargeshotSound) this.chargeshotSound.volume = this.sfxVolume;
    if (this.secretEnemySound) this.secretEnemySound.volume = this.sfxVolume;

    // Special Attack System
    this.chargeShot = {
      charge: 0,
      maxCharge: 10, // Enemies needed for full charge
      isReady: false,
      lastUsed: 0,
      cooldown: 3000 // 3 seconds cooldown after use
    };

    // Images
    this.images = {};
    this.loadImages();

    // Initialize
    this.setupEventListeners();
    this.setupUI();

    // Start game loop
    this.gameLoop();

    // TEMPORARY: Add test trigger for upgrade screen
    window.testUpgradeScreen = () => {
      console.log("=== MANUAL UPGRADE SCREEN TEST ===");
      this.showUpgradeScreen();
    };

    console.log(
      "Game initialized. Type testUpgradeScreen() in console to test upgrade screen."
    );
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    
    let displayWidth, displayHeight;
    
    if (isMobile) {
      // For mobile, use portrait 9:16 aspect ratio (720×1280) for modern phones
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight - 120; // Leave space for mobile controls
      const aspectRatio = 9 / 16; // Portrait aspect ratio for phones
      
      // Use 98% of available space for better mobile experience
      const maxWidth = viewportWidth * 0.98;
      const maxHeight = viewportHeight * 0.95;
      
      if (maxWidth / maxHeight > aspectRatio) {
        // Height is the limiting factor
        displayHeight = maxHeight;
        displayWidth = displayHeight * aspectRatio;
      } else {
        // Width is the limiting factor
        displayWidth = maxWidth;
        displayHeight = displayWidth / aspectRatio;
      }
      
      // Ensure minimum playable size with 9:16 ratio
      displayWidth = Math.max(360, Math.min(displayWidth, viewportWidth * 0.98));
      displayHeight = Math.max(640, Math.min(displayHeight, viewportHeight * 0.95));
    } else {
      // Desktop - use fixed dimensions but scale down if needed
      displayWidth = Math.min(1280, window.innerWidth - 40);
      displayHeight = Math.min(720, window.innerHeight - 40);
      
      // Maintain aspect ratio on desktop too
      const aspectRatio = 16 / 9;
      if (displayWidth / displayHeight > aspectRatio) {
        displayWidth = displayHeight * aspectRatio;
      } else {
        displayHeight = displayWidth / aspectRatio;
      }
    }

    // Set the actual canvas size in memory (scaled up for crisp rendering)
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // Scale the canvas back down using CSS for display
    this.canvas.style.width = displayWidth + "px";
    this.canvas.style.height = displayHeight + "px";

    // Scale the drawing context so everything draws at the correct size
    this.ctx.scale(dpr, dpr);

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Store display dimensions for game logic
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;
    
    // Store scale factor for coordinate conversion
    this.scaleFactor = isMobile ? displayWidth / 720 : displayWidth / 1280; // Scale factor relative to mobile (720) or desktop (1280)

    // Update player position if it exists
    if (this.player) {
      // Keep player in bounds
      this.player.x = Math.min(this.player.x, displayWidth - this.player.width * this.scaleFactor);
      this.player.y = Math.min(this.player.y, displayHeight - this.player.height * this.scaleFactor);
    }
    
    // Update mobile controls visibility
    this.updateMobileControlsVisibility();
  }
  
  updateMobileControlsVisibility() {
    const mobileControls = document.querySelector('.mobile-controls');
    const isMobile = window.innerWidth <= 768;
    
    if (mobileControls) {
      mobileControls.style.display = isMobile ? 'block' : 'none';
    }
  }

  loadImages() {
    const imageList = [
      "playerShip",
      "bullet",
      "powershot",
      "rapidfire",
      "shield",
      "extradamage",
      "secretenemy",
      "hit-effect",
      "enemyOne",
      "enemyTwo",
      "enemyThree",
      "enemyFour",
      "enemyFive",
      "enemySix",
      "firstboss",
      "secondboss",
      "firstbossbullet",
      "secondbossbullet",
    ];

    // Add map backgrounds
    Object.keys(this.maps).forEach((mapKey) => {
      imageList.push(`map_${mapKey}`);
    });

    let loadedImages = 0;
    const totalImages = imageList.length;

    imageList.forEach((imageName) => {
      const img = new Image();
      img.onload = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
          this.imagesLoaded = true;
          this.createPlayer();
          this.updateMapScores();
        }
      };

      if (imageName.startsWith("map_")) {
        const mapKey = imageName.replace("map_", "");
        img.src = this.maps[mapKey].background;
      } else {
        img.src = `assets/images/${imageName}.png`;
      }

      this.images[imageName] = img;
    });
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;

      if (e.code === "Space") {
        e.preventDefault();
        this.shoot();
      }

      if (e.code === "KeyE") {
        e.preventDefault();
        this.chargeShoot();
      }

      if (e.code === "Escape") {
        e.preventDefault();
        if (this.gameState === "playing") {
          // During gameplay, show settings instead of pause
          this.showSettings();
        } else {
          this.togglePause();
        }
      }
    });

    document.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Mouse events for shooting
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        // Left mouse button
        e.preventDefault();
        this.mouseDown = true;
        this.shoot();
      }
    });

    this.canvas.addEventListener("mouseup", (e) => {
      if (e.button === 0) {
        // Left mouse button
        e.preventDefault();
        this.mouseDown = false;
      }
    });

    // Prevent context menu on right click
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Mouse leave event to stop shooting
    this.canvas.addEventListener("mouseleave", (e) => {
      this.mouseDown = false;
    });

    // Window resize event for fullscreen
    window.addEventListener("resize", () => {
      // Reset context transform before resize
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.resizeCanvas();
    });

    // UI button events
    document.getElementById("selectMapButton").addEventListener("click", () => {
      this.showMapSelection();
    });

    document
      .getElementById("quickStartButton")
      .addEventListener("click", () => {
        this.selectedMap = "space"; // Default to space map
        this.startGame();
      });

    document
      .getElementById("backToMenuButton")
      .addEventListener("click", () => {
        this.showMenu();
      });

    // Map selection buttons
    document.querySelectorAll(".select-map-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mapKey = e.target.getAttribute("data-map");
        this.selectMap(mapKey);
      });
    });

    // Map card click events
    document.querySelectorAll(".map-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (!card.classList.contains("locked")) {
          const mapKey = card.getAttribute("data-map");
          this.selectMap(mapKey);
        }
      });
    });

    document.getElementById("pauseButton").addEventListener("click", () => {
      this.togglePause();
    });

    document.getElementById("resumeButton").addEventListener("click", () => {
      this.togglePause();
    });

    document.getElementById("restartButton").addEventListener("click", () => {
      this.restartGame();
    });

    document.getElementById("menuButton").addEventListener("click", () => {
      this.showMenu();
    });

    document.getElementById("mainMenuButton").addEventListener("click", () => {
      this.showMenu();
    });

    document.getElementById("muteButton").addEventListener("click", () => {
      this.toggleMute();
    });

    // Upgrade system event listeners
    document.querySelectorAll(".upgrade-btn").forEach((btn) => {
      const card = btn.closest(".upgrade-card");
      const upgradeType = card ? card.getAttribute("data-upgrade") : null;

      console.log("Setting up upgrade button for:", upgradeType);

      btn.addEventListener("click", (e) => {
        const clickedCard = e.target.closest(".upgrade-card");
        const clickedUpgradeType = clickedCard
          ? clickedCard.getAttribute("data-upgrade")
          : null;

        console.log(`Upgrade button clicked: ${clickedUpgradeType}`);

        if (clickedUpgradeType) {
          this.purchaseUpgrade(clickedUpgradeType);
        } else {
          console.error("No upgrade type found on button or card");
        }
      });
    });

    // Settings system event listeners
    document.getElementById("closeSettingsButton").addEventListener("click", () => {
      this.hideSettings();
    });

    // Music volume slider
    const musicSlider = document.getElementById("musicVolumeSlider");
    const musicValue = document.getElementById("musicVolumeValue");
    
    musicSlider.addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      this.updateMusicVolume(volume);
      musicValue.textContent = e.target.value + "%";
      
      // Save to localStorage
      localStorage.setItem('gameSettings_musicVolume', volume);
    });

    // Sound effects volume slider
    const sfxSlider = document.getElementById("sfxVolumeSlider");
    const sfxValue = document.getElementById("sfxVolumeValue");
    
    sfxSlider.addEventListener("input", (e) => {
      const volume = e.target.value / 100;
      this.updateSfxVolume(volume);
      sfxValue.textContent = e.target.value + "%";
      
      // Save to localStorage
      localStorage.setItem('gameSettings_sfxVolume', volume);
    });
    
    // Touch controls setup
    this.setupTouchControls();
  }

  setupTouchControls() {
    // Touch control state
    this.touchControls = {
      joystick: {
        active: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        deltaX: 0,
        deltaY: 0,
        maxDistance: 60
      },
      shooting: false,
      chargeShooting: false
    };

    // Get touch control elements
    const virtualJoystick = document.getElementById('virtualJoystick');
    const joystickKnob = document.getElementById('joystickKnob');
    const shootButton = document.getElementById('shootButton');
    const chargeShotButton = document.getElementById('chargeShotButton');

    if (!virtualJoystick || !joystickKnob || !shootButton || !chargeShotButton) {
      console.log('Touch controls not found, skipping setup');
      return;
    }

    // Virtual Joystick Controls
    const handleJoystickStart = (e) => {
      e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      const rect = virtualJoystick.getBoundingClientRect();
      
      this.touchControls.joystick.active = true;
      this.touchControls.joystick.startX = rect.left + rect.width / 2;
      this.touchControls.joystick.startY = rect.top + rect.height / 2;
      this.touchControls.joystick.currentX = touch.clientX;
      this.touchControls.joystick.currentY = touch.clientY;
      
      this.updateJoystickPosition();
    };

    const handleJoystickMove = (e) => {
      if (!this.touchControls.joystick.active) return;
      e.preventDefault();
      
      const touch = e.touches ? e.touches[0] : e;
      this.touchControls.joystick.currentX = touch.clientX;
      this.touchControls.joystick.currentY = touch.clientY;
      
      this.updateJoystickPosition();
    };

    const handleJoystickEnd = (e) => {
      e.preventDefault();
      this.touchControls.joystick.active = false;
      this.touchControls.joystick.deltaX = 0;
      this.touchControls.joystick.deltaY = 0;
      
      // Reset joystick knob to center
      joystickKnob.style.transform = 'translate(-50%, -50%)';
    };

    // Joystick event listeners
    virtualJoystick.addEventListener('touchstart', handleJoystickStart);
    virtualJoystick.addEventListener('touchmove', handleJoystickMove);
    virtualJoystick.addEventListener('touchend', handleJoystickEnd);
    virtualJoystick.addEventListener('touchcancel', handleJoystickEnd);

    // Mouse support for testing on desktop
    virtualJoystick.addEventListener('mousedown', handleJoystickStart);
    document.addEventListener('mousemove', handleJoystickMove);
    document.addEventListener('mouseup', handleJoystickEnd);

    // Shoot Button Controls
    const handleShootStart = (e) => {
      e.preventDefault();
      this.touchControls.shooting = true;
      shootButton.style.transform = 'scale(0.95)';
    };

    const handleShootEnd = (e) => {
      e.preventDefault();
      this.touchControls.shooting = false;
      shootButton.style.transform = 'scale(1)';
    };

    // Shoot button event listeners
    shootButton.addEventListener('touchstart', handleShootStart);
    shootButton.addEventListener('touchend', handleShootEnd);
    shootButton.addEventListener('touchcancel', handleShootEnd);
    shootButton.addEventListener('mousedown', handleShootStart);
    shootButton.addEventListener('mouseup', handleShootEnd);

    // Charge Shot Button Controls
    const handleChargeShotStart = (e) => {
      e.preventDefault();
      this.touchControls.chargeShooting = true;
      chargeShotButton.style.transform = 'scale(0.95)';
      this.chargeShoot();
    };

    const handleChargeShotEnd = (e) => {
      e.preventDefault();
      this.touchControls.chargeShooting = false;
      chargeShotButton.style.transform = 'scale(1)';
    };

    // Charge shot button event listeners
    chargeShotButton.addEventListener('touchstart', handleChargeShotStart);
    chargeShotButton.addEventListener('touchend', handleChargeShotEnd);
    chargeShotButton.addEventListener('touchcancel', handleChargeShotEnd);
    chargeShotButton.addEventListener('mousedown', handleChargeShotStart);
    chargeShotButton.addEventListener('mouseup', handleChargeShotEnd);
  }

  updateJoystickPosition() {
    const joystickKnob = document.getElementById('joystickKnob');
    if (!joystickKnob || !this.touchControls.joystick.active) return;

    const deltaX = this.touchControls.joystick.currentX - this.touchControls.joystick.startX;
    const deltaY = this.touchControls.joystick.currentY - this.touchControls.joystick.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = this.touchControls.joystick.maxDistance;

    if (distance <= maxDistance) {
      this.touchControls.joystick.deltaX = deltaX;
      this.touchControls.joystick.deltaY = deltaY;
      joystickKnob.style.transform = `translate(${deltaX - 20}px, ${deltaY - 20}px)`; // Adjusted for smaller knob
    } else {
      // Clamp to max distance
      const ratio = maxDistance / distance;
      this.touchControls.joystick.deltaX = deltaX * ratio;
      this.touchControls.joystick.deltaY = deltaY * ratio;
      joystickKnob.style.transform = `translate(${deltaX * ratio - 20}px, ${deltaY * ratio - 20}px)`; // Adjusted for smaller knob
    }
  }

  updateTouchControls() {
    // Update charge shot button state
    const chargeShotButton = document.getElementById('chargeShotButton');
    if (chargeShotButton) {
      if (this.chargeShot.isReady) {
        chargeShotButton.classList.add('ready');
      } else {
        chargeShotButton.classList.remove('ready');
      }
    }
  }

  setupUI() {
    this.updateScore();
    this.updateLives();
    this.updateLevel();
  }

  createPlayer() {
    const isMobile = window.innerWidth <= 768;
    const canvasWidth = this.displayWidth || this.canvas.width;
    const canvasHeight = this.displayHeight || this.canvas.height;
    
    this.player = {
      x: canvasWidth / 2 - 70, // Center horizontally (adjusted for ship width)
      y: isMobile ? canvasHeight - 180 : canvasHeight - 120, // Position higher on mobile for portrait layout
      width: 140, // Using preferred ship size from memory
      height: 105, // Using preferred ship size from memory
      speed: this.baseSpeed || 5,
      health: this.maxHealth || 1,
      maxHealth: this.maxHealth || 1,
      shielded: false,
    };

    // Apply upgrades if they exist
    this.applyUpgrades();
  }

  startGame() {
    console.log("Starting game - initializing...");
    this.gameState = "playing";
    this.gameRunning = true;
    this.score = 0;
    this.level = 1;
    this.lives = 25;

    // Initialize round system with longer rounds
    this.currentRound = 1;
    this.roundEnemiesKilled = 0;
    this.roundEnemiesNeeded = 25; // Start with 25 enemies instead of 10
    this.roundInProgress = true;
    this.bossActive = false;
    this.currentBoss = null;

    // Reset upgrades for new game
    this.shipUpgrades = {
      damage: 0,
      health: 0,
      speed: 0,
      firerate: 0,
      homing: 0,
      spread: 0,
    };

    console.log("Game initialized with round:", this.currentRound);
    console.log("Upgrades reset:", this.shipUpgrades);

    // Apply map-specific settings
    const currentMap = this.maps[this.selectedMap];
    this.enemySpawnRate = currentMap.enemySpawnRate;
    this.currentScoreMultiplier = currentMap.scoreMultiplier;
    this.currentSpeedMultiplier = currentMap.speedMultiplier;

    // Initialize base stats
    this.baseDamage = 1;
    this.maxHealth = 1;
    this.baseSpeed = 5;
    this.baseShootCooldown = 200;
    this.shootCooldown = this.baseShootCooldown;

    // Reset arrays
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    this.explosions = [];
    this.hitEffects = []; // Reset hit effects

    // Reset power-ups
    Object.keys(this.powerUpStates).forEach((key) => {
      this.powerUpStates[key].active = false;
      this.powerUpStates[key].timeLeft = 0;
    });

    // Reset charge shot system
    this.chargeShot.charge = 0;
    this.chargeShot.isReady = false;
    this.chargeShot.lastUsed = 0;

    // Create player
    this.createPlayer();

    // Show game screen
    this.showScreen("gameScreen");

    // Hide boss health bar initially
    this.hideBossHealthBar();

    // Start background music
    if (this.audioEnabled) {
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusic.play().catch(() => {});
    }

    // Update UI
    this.updateScore();
    this.updateLives();
    this.updateLevel();
    this.updateRoundDisplay();
    this.updatePowerUpIndicators();
  }

  restartGame() {
    this.startGame();
  }

  showMenu() {
    this.gameState = "menu";
    this.gameRunning = false;
    this.showScreen("startScreen");
    
    // Stop all music when returning to menu
    this.backgroundMusic.pause();
    if (this.bossIntroMusic) {
      this.bossIntroMusic.pause();
      this.bossIntroMusic.currentTime = 0;
    }
    if (this.firstBossSound) {
      this.firstBossSound.pause();
      this.firstBossSound.currentTime = 0;
    }
    if (this.secondBossSound) {
      this.secondBossSound.pause();
      this.secondBossSound.currentTime = 0;
    }
  }

  showMapSelection() {
    this.gameState = "mapSelection";
    this.showScreen("mapSelectionScreen");
    this.updateMapDisplay();
  }

  selectMap(mapKey) {
    if (this.maps[mapKey] && this.maps[mapKey].unlocked) {
      this.selectedMap = mapKey;
      this.startGame();
    }
  }

  updateMapDisplay() {
    // Update best scores for each map
    Object.keys(this.mapScores).forEach((mapKey) => {
      const scoreElement = document.getElementById(`${mapKey}Score`);
      if (scoreElement) {
        scoreElement.textContent = this.mapScores[mapKey];
      }
    });

    // Update locked/unlocked status
    document.querySelectorAll(".map-card").forEach((card) => {
      const mapKey = card.getAttribute("data-map");
      if (this.maps[mapKey] && !this.maps[mapKey].unlocked) {
        card.classList.add("locked");
      } else {
        card.classList.remove("locked");
      }
    });
  }

  updateMapScores() {
    // Load scores from localStorage
    Object.keys(this.mapScores).forEach((mapKey) => {
      this.mapScores[mapKey] = parseInt(
        localStorage.getItem(`${mapKey}Score`) || "0"
      );
    });

    // Update display if on map selection screen
    if (this.gameState === "mapSelection") {
      this.updateMapDisplay();
    }
  }

  saveMapScore(mapKey, score) {
    if (score > this.mapScores[mapKey]) {
      this.mapScores[mapKey] = score;
      localStorage.setItem(`${mapKey}Score`, score.toString());
      this.updateMapDisplay();
    }
  }

  showUpgradeScreen() {
    console.log("=== SHOW UPGRADE SCREEN START ===");
    console.log("Showing upgrade screen for round:", this.currentRound);
    console.log("Current upgrades:", this.shipUpgrades);
    console.log("Current game state:", this.gameState);

    this.gameState = "upgrade";
    console.log("Set game state to upgrade");

    this.showScreen("upgradeScreen");
    console.log("Called showScreen with upgradeScreen");

    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      this.updateUpgradeDisplay();
    }, 100);

    // Stop all music during upgrade screen
    this.backgroundMusic.pause();
    if (this.bossIntroMusic) {
      this.bossIntroMusic.pause();
    }
    console.log("=== SHOW UPGRADE SCREEN END ===");
  }

  updateUpgradeDisplay() {
    console.log("=== UPDATE UPGRADE DISPLAY START ===");

    // Update round and score display
    const currentRoundElement = document.getElementById("currentRound");
    const roundScoreElement = document.getElementById("roundScore");

    if (currentRoundElement) {
      currentRoundElement.textContent = this.currentRound;
      console.log("Updated round display to:", this.currentRound);
    }
    if (roundScoreElement) {
      roundScoreElement.textContent = this.score;
      console.log("Updated score display to:", this.score);
    }

    // Hide all upgrade cards first
    const allCards = document.querySelectorAll(".upgrade-card");
    console.log("Found upgrade cards:", allCards.length);
    allCards.forEach((card) => {
      card.style.display = "none";
      console.log("Hiding card:", card.getAttribute("data-upgrade"));
    });

    // Get available upgrades (not at max level)
    const availableUpgrades = Object.keys(this.shipUpgrades).filter(
      (upgradeType) => {
        const maxLevel =
          upgradeType === "homing" || upgradeType === "spread" ? 3 : 5;
        const currentLevel = this.shipUpgrades[upgradeType];
        const isAvailable = currentLevel < maxLevel;
        console.log(
          `${upgradeType}: level ${currentLevel}/${maxLevel}, available: ${isAvailable}`
        );
        return isAvailable;
      }
    );

    console.log("Available upgrades:", availableUpgrades);
    console.log("Current upgrade levels:", this.shipUpgrades);

    // Select 3 random upgrades (or all if less than 3 available)
    const selectedUpgrades = [];
    const upgradeCount = Math.min(3, availableUpgrades.length);
    const tempAvailable = [...availableUpgrades]; // Create copy to avoid modifying original

    while (selectedUpgrades.length < upgradeCount && tempAvailable.length > 0) {
      const randomIndex = Math.floor(Math.random() * tempAvailable.length);
      const upgrade = tempAvailable.splice(randomIndex, 1)[0];
      selectedUpgrades.push(upgrade);
    }

    console.log("Selected upgrades for this round:", selectedUpgrades);

    // Show and update only the selected upgrade cards
    selectedUpgrades.forEach((upgradeType) => {
      console.log(`Processing upgrade: ${upgradeType}`);

      // Find the upgrade card by data-upgrade attribute
      const card = document.querySelector(
        `.upgrade-card[data-upgrade="${upgradeType}"]`
      );

      if (!card) {
        console.error(
          `No upgrade card found with data-upgrade="${upgradeType}"`
        );
        return;
      }

      // Find the button and level elements within this card
      const button = card.querySelector(".upgrade-btn");
      const levelElement = card.querySelector(".level-display");

      if (!button) {
        console.error(`No upgrade button found in card for ${upgradeType}`);
        return;
      }

      const level = this.shipUpgrades[upgradeType];

      // Show the card
      card.style.display = "block";
      console.log(`Showing card for ${upgradeType}`);

      // Update level display
      if (levelElement) {
        levelElement.textContent = level;
        console.log(`Updated ${upgradeType} level display to:`, level);
      } else {
        console.error(`Level element not found for ${upgradeType}`);
      }

      // Update button
      button.textContent = "SELECT";
      button.disabled = false;
      button.style.background = "";
      button.style.opacity = "";
      card.classList.remove("maxed");
      console.log(`Updated button for ${upgradeType}`);
    });

    console.log("=== UPDATE UPGRADE DISPLAY END ===");
  }

  purchaseUpgrade(upgradeType) {
    // Set max levels: 5 for basic upgrades, 3 for special upgrades
    const maxLevel =
      upgradeType === "homing" || upgradeType === "spread" ? 3 : 5;

    console.log(
      `Attempting to upgrade ${upgradeType}: Current level ${this.shipUpgrades[upgradeType]}/${maxLevel}`
    );

    if (this.shipUpgrades[upgradeType] < maxLevel) {
      this.shipUpgrades[upgradeType]++;
      console.log(
        `${upgradeType} upgraded to level ${this.shipUpgrades[upgradeType]}`
      );

      // Disable all upgrade buttons and show selection feedback
      document.querySelectorAll(".upgrade-card").forEach((card) => {
        const button = card.querySelector(".upgrade-btn");
        const cardUpgradeType = card.getAttribute("data-upgrade");

        if (button) {
          button.disabled = true;
          if (cardUpgradeType === upgradeType) {
            button.textContent = "SELECTED!";
            button.style.background =
              "linear-gradient(45deg, #00ff00, #00cc00)";
            card.style.borderColor = "#00ff00";
            card.style.boxShadow = "0 0 20px rgba(0,255,0,0.5)";
          } else {
            button.textContent = "NOT SELECTED";
            button.style.opacity = "0.5";
            card.style.opacity = "0.6";
          }
        }
      });

      this.applyUpgrades();

      // Visual feedback
      this.createUpgradeEffect(upgradeType);

      // Automatically continue to next round after short delay
      setTimeout(() => {
        this.continueToNextRound();
      }, 1500);
    } else {
      console.log(`${upgradeType} is already at max level`);
    }
  }

  applyUpgrades() {
    console.log("Applying upgrades:", this.shipUpgrades);

    // Apply damage upgrade
    this.baseDamage = 1 + this.shipUpgrades.damage * 0.25;
    console.log(`Base damage: ${this.baseDamage}`);

    // Apply health upgrade
    const oldMaxHealth = this.maxHealth;
    this.maxHealth = 1 + this.shipUpgrades.health;

    if (this.player) {
      // If health increased, add the difference to current health
      if (this.maxHealth > oldMaxHealth) {
        this.player.health += this.maxHealth - oldMaxHealth;
      }
      this.player.health = Math.min(this.player.health, this.maxHealth);
      this.player.maxHealth = this.maxHealth;
    }
    console.log(`Max health: ${this.maxHealth}`);

    // Apply speed upgrade
    this.baseSpeed = 5 + this.shipUpgrades.speed * 1;
    if (this.player) {
      this.player.speed = this.baseSpeed;
    }
    console.log(`Base speed: ${this.baseSpeed}`);

    // Apply fire rate upgrade
    this.baseShootCooldown = 200 - this.shipUpgrades.firerate * 30;
    this.shootCooldown = Math.max(50, this.baseShootCooldown);
    console.log(`Shoot cooldown: ${this.shootCooldown}`);

    console.log(
      `Homing level: ${this.shipUpgrades.homing}, Spread level: ${this.shipUpgrades.spread}`
    );
  }

  createUpgradeEffect(upgradeType) {
    // Visual feedback for upgrade purchase
    const colors = {
      damage: "#ff6b6b",
      health: "#ff4757",
      speed: "#ffff00",
      firerate: "#4ecdc4",
      homing: "#ff00ff",
      spread: "#00ff00",
    };

    // Create particle effect
    for (let i = 0; i < 15; i++) {
      this.createParticle(
        window.innerWidth / 2,
        window.innerHeight / 2,
        Math.random() * 360,
        3 + Math.random() * 4,
        colors[upgradeType] || "#ffffff"
      );
    }
  }

  continueToNextRound() {
    this.currentRound++;
    this.roundEnemiesKilled = 0;
    
    // Dramatically increase enemies needed each round (much more challenging progression)
    // Round 1: 25, Round 2: 40, Round 3: 60, Round 4: 85, Round 5: 115, etc.
    this.roundEnemiesNeeded = 25 + this.currentRound * 15 + Math.floor((this.currentRound - 1) * (this.currentRound - 1) * 2.5);
    
    this.roundInProgress = true;
    this.bossActive = false;

    // Ensure player exists and apply upgrades
    if (!this.player) {
      this.createPlayer();
    }
    this.applyUpgrades();

    // Increase difficulty
    this.increaseDifficulty();

    // Continue game
    this.gameState = "playing";
    this.showScreen("gameScreen");

    // Update UI
    this.updateRoundDisplay();

    if (this.audioEnabled) {
      this.backgroundMusic.play().catch(() => {});
    }

    console.log(
      `Starting round ${this.currentRound} with ${this.roundEnemiesNeeded} enemies needed before boss. Upgrades:`,
      this.shipUpgrades
    );
  }

  increaseDifficulty() {
    // Dramatically increase enemy spawn rate (spawn enemies much more frequently)
    const currentMap = this.maps[this.selectedMap];
    this.enemySpawnRate = Math.max(
      300, // Minimum spawn rate (very fast)
      currentMap.enemySpawnRate - this.currentRound * 150 // Much faster reduction
    );

    // Increase enemy speed multiplier more aggressively
    this.currentSpeedMultiplier =
      currentMap.speedMultiplier + this.currentRound * 0.15;

    // Increase score multiplier
    this.currentScoreMultiplier =
      currentMap.scoreMultiplier + this.currentRound * 0.25;
      
    console.log(`Round ${this.currentRound} difficulty: spawn rate=${this.enemySpawnRate}ms, speed=${this.currentSpeedMultiplier.toFixed(2)}x, enemies needed=${this.roundEnemiesNeeded}`);
  }

  updateRoundDisplay() {
    const roundElement = document.getElementById("gameRound");
    if (roundElement) {
      roundElement.textContent = this.currentRound;
      console.log(`Updated round display to: ${this.currentRound}`);
    } else {
      console.error("Round display element not found!");
    }
  }

  spawnBoss() {
    // Prevent spawning if boss is already active
    if (this.bossActive) {
      console.log(
        `Boss already active, skipping spawn in round ${this.currentRound}`
      );
      return;
    }

    this.bossActive = true;

    // Determine number of bosses based on round (1 boss for rounds 1-3, 2 bosses for round 4+)
    const numBosses = this.currentRound >= 4 ? 2 : 1;

    console.log(`Round ${this.currentRound}: Spawning ${numBosses} boss(es)`); // Debug log

    // Choose boss type randomly between destroyer and cruiser
    const bossTypes = ["destroyer", "cruiser"];
    const randomBossType =
      bossTypes[Math.floor(Math.random() * bossTypes.length)];
    let bossType = this.bossTypes[randomBossType];

    // Use mothership for very high rounds (7+)
    if (this.currentRound >= 7) {
      bossType = this.bossTypes.mothership;
    }

    // Scale boss health with round
    const healthMultiplier = 1 + (this.currentRound - 1) * 0.3;

    const screenWidth = this.displayWidth || this.canvas.width;

    // Spawn multiple bosses
    for (let i = 0; i < numBosses; i++) {
      let bossX;
      if (numBosses === 1) {
        // Single boss - center position
        bossX = (screenWidth - bossType.width) / 2;
      } else {
        // Multiple bosses - spread them out
        const spacing = screenWidth / (numBosses + 1);
        bossX = spacing * (i + 1) - bossType.width / 2;

        // Ensure bosses stay within screen bounds
        bossX = Math.max(0, Math.min(screenWidth - bossType.width, bossX));
      }

      const boss = {
        x: bossX,
        y: -bossType.height - i * 50, // Stagger vertical position
        width: bossType.width,
        height: bossType.height,
        speed: bossType.speed,
        maxHealth: Math.floor(bossType.health * healthMultiplier),
        health: Math.floor(bossType.health * healthMultiplier),
        damage: bossType.damage,
        shootCooldown: bossType.shootCooldown + i * 200, // Stagger shooting
        specialAttackCooldown: bossType.specialAttackCooldown + i * 500,
        lastShot: 0,
        lastSpecialAttack: 0,
        sprite: bossType.sprite,
        bulletSprite: bossType.bulletSprite,
        sound: bossType.sound,
        name: numBosses > 1 ? `${bossType.name} ${i + 1}` : bossType.name,
        pattern: "boss",
        movementTimer: i * Math.PI, // Different phase for each boss
        movementDirection: i % 2 === 0 ? 1 : -1, // Alternate movement directions
        bossType: bossType, // Store reference to boss type
        bossIndex: i, // Store boss index for tracking
      };

      // Add boss to enemies array
      this.enemies.push(boss);
    }

    // Store reference to first boss for health bar (or create combined health)
    this.currentBoss = this.enemies.find((enemy) => enemy.pattern === "boss");

    // Show boss health bar
    this.showBossHealthBar();
    
    // Play boss intro music
    if (this.audioEnabled && this.bossIntroMusic) {
      // Pause background music for boss fight
      this.backgroundMusic.pause();
      
      // Play boss intro music
      this.bossIntroMusic.currentTime = 0;
      this.bossIntroMusic.play().catch(() => {});
      
      // Background music will remain paused during boss fight
    }
  }

  showBossHealthBar() {
    const healthContainer = document.getElementById("bossHealthContainer");
    const bossNameElement = document.getElementById("bossName");

    if (healthContainer && bossNameElement) {
      const bosses = this.enemies.filter((enemy) => enemy.pattern === "boss");

      if (bosses.length > 0) {
        healthContainer.style.display = "block";

        if (bosses.length === 1) {
          bossNameElement.textContent = bosses[0].name;
        } else {
          // Multiple bosses - show generic name with count
          const bossTypeName = bosses[0].name.replace(/ \d+$/, ""); // Remove number suffix
          bossNameElement.textContent = `${bossTypeName} SQUADRON`;
        }

        this.updateBossHealthBar();
      }
    }
  }

  hideBossHealthBar() {
    const healthContainer = document.getElementById("bossHealthContainer");
    if (healthContainer) {
      healthContainer.style.display = "none";
    }
  }

  updateBossHealthBar() {
    const bosses = this.enemies.filter((enemy) => enemy.pattern === "boss");
    if (bosses.length === 0) return;

    const healthFill = document.getElementById("bossHealthFill");
    const healthText = document.getElementById("bossHealthText");

    if (healthFill && healthText) {
      if (bosses.length === 1) {
        // Single boss - show individual health
        const boss = bosses[0];
        const healthPercent = (boss.health / boss.maxHealth) * 100;
        healthFill.style.width = healthPercent + "%";
        healthText.textContent = `${boss.health}/${boss.maxHealth}`;
      } else {
        // Multiple bosses - show combined health
        const totalHealth = bosses.reduce((sum, boss) => sum + boss.health, 0);
        const totalMaxHealth = bosses.reduce(
          (sum, boss) => sum + boss.maxHealth,
          0
        );
        const healthPercent = (totalHealth / totalMaxHealth) * 100;
        healthFill.style.width = healthPercent + "%";
        healthText.textContent = `${totalHealth}/${totalMaxHealth}`;
      }
    }
  }

  togglePause() {
    if (this.gameState === "playing") {
      this.gameState = "paused";
      this.showScreen("pauseScreen");
      this.backgroundMusic.pause();
    } else if (this.gameState === "paused") {
      this.gameState = "playing";
      this.showScreen("gameScreen");
      if (this.audioEnabled) {
        this.backgroundMusic.play().catch(() => {});
      }
    }
  }

  gameOver() {
    this.gameState = "gameOver";
    this.gameRunning = false;
    this.showScreen("gameOverScreen");
    
    // Stop all music when game ends
    this.backgroundMusic.pause();
    if (this.bossIntroMusic) {
      this.bossIntroMusic.pause();
      this.bossIntroMusic.currentTime = 0;
    }
    if (this.firstBossSound) {
      this.firstBossSound.pause();
      this.firstBossSound.currentTime = 0;
    }
    if (this.secondBossSound) {
      this.secondBossSound.pause();
      this.secondBossSound.currentTime = 0;
    }

    // Save high score for current map
    this.saveMapScore(this.selectedMap, this.score);

    document.getElementById("finalScore").textContent = this.score;
  }

  showScreen(screenId) {
    console.log(`showScreen called with: ${screenId}`);

    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
      console.log(`Removed active from: ${screen.id}`);
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add("active");
      console.log(`Added active to: ${screenId}`);
    } else {
      console.error(`Screen with id ${screenId} not found!`);
    }
  }

  toggleMute() {
    this.audioEnabled = !this.audioEnabled;
    const muteButton = document.getElementById("muteButton");

    if (this.audioEnabled) {
      muteButton.textContent = "🔊";
      if (this.gameState === "playing") {
        this.backgroundMusic.play().catch(() => {});
      }
    } else {
      muteButton.textContent = "🔇";
      this.backgroundMusic.pause();
    }
  }

  // Settings screen methods
  showSettings() {
    if (this.gameState === "playing") {
      // Pause the game when showing settings
      this.gameState = "settings";
      this.backgroundMusic.pause();
    }
    this.showScreen("settingsScreen");
    this.updateSettingsUI();
  }

  hideSettings() {
    if (this.gameState === "settings") {
      // Resume the game when hiding settings
      this.gameState = "playing";
      this.showScreen("gameScreen");
      if (this.audioEnabled) {
        this.backgroundMusic.play().catch(() => {});
      }
    } else {
      // Return to previous screen if not from gameplay
      this.showScreen("startScreen");
    }
  }

  updateSettingsUI() {
    // Update slider values to match current settings
    const musicSlider = document.getElementById("musicVolumeSlider");
    const musicValue = document.getElementById("musicVolumeValue");
    const sfxSlider = document.getElementById("sfxVolumeSlider");
    const sfxValue = document.getElementById("sfxVolumeValue");

    if (musicSlider && musicValue) {
      musicSlider.value = Math.round(this.musicVolume * 100);
      musicValue.textContent = Math.round(this.musicVolume * 100) + "%";
    }

    if (sfxSlider && sfxValue) {
      sfxSlider.value = Math.round(this.sfxVolume * 100);
      sfxValue.textContent = Math.round(this.sfxVolume * 100) + "%";
    }
  }

  loadAudioSettings() {
    // Load saved audio settings from localStorage
    const savedMusicVolume = localStorage.getItem('gameSettings_musicVolume');
    const savedSfxVolume = localStorage.getItem('gameSettings_sfxVolume');

    if (savedMusicVolume !== null) {
      this.musicVolume = parseFloat(savedMusicVolume);
    }

    if (savedSfxVolume !== null) {
      this.sfxVolume = parseFloat(savedSfxVolume);
    }
  }

  updateMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    // Update all music audio elements
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
    if (this.bossIntroMusic) {
      this.bossIntroMusic.volume = this.musicVolume;
    }
    if (this.firstBossSound) {
      this.firstBossSound.volume = this.musicVolume;
    }
    if (this.secondBossSound) {
      this.secondBossSound.volume = this.musicVolume;
    }
  }

  updateSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    // Update all sound effect audio elements
    if (this.shootSound) {
      this.shootSound.volume = this.sfxVolume;
    }
    if (this.popSound) {
      this.popSound.volume = this.sfxVolume;
    }
    if (this.enemyBullet) {
      this.enemyBullet.volume = this.sfxVolume;
    }
    if (this.powerupSound) {
      this.powerupSound.volume = this.sfxVolume;
    }
    if (this.chargeshotSound) {
      this.chargeshotSound.volume = this.sfxVolume;
    }
    if (this.secretEnemySound) {
      this.secretEnemySound.volume = this.sfxVolume;
    }
  }

  updatePlayer() {
    if (!this.player) return;

    // Movement from keyboard
    let moveX = 0;
    let moveY = 0;
    
    // Keyboard input
    if (this.keys["ArrowLeft"] || this.keys["KeyA"]) moveX -= 1;
    if (this.keys["ArrowRight"] || this.keys["KeyD"]) moveX += 1;
    if (this.keys["ArrowUp"] || this.keys["KeyW"]) moveY -= 1;
    if (this.keys["ArrowDown"] || this.keys["KeyS"]) moveY += 1;
    
    // Touch input (virtual joystick)
    if (this.touchControls && this.touchControls.joystick.active) {
      const normalizedX = this.touchControls.joystick.deltaX / this.touchControls.joystick.maxDistance;
      const normalizedY = this.touchControls.joystick.deltaY / this.touchControls.joystick.maxDistance;
      
      // Apply touch input (with sensitivity adjustment)
      moveX += normalizedX * 1.2;
      moveY += normalizedY * 1.2;
    }
    
    // Clamp movement values
    moveX = Math.max(-1, Math.min(1, moveX));
    moveY = Math.max(-1, Math.min(1, moveY));

    // Apply movement
    const speed = this.player.speed;
    const screenWidth = this.displayWidth || this.canvas.width;
    const screenHeight = this.displayHeight || this.canvas.height;

    const newX = this.player.x + moveX * speed;
    const newY = this.player.y + moveY * speed;
    
    // Keep player in bounds
    this.player.x = Math.max(0, Math.min(screenWidth - this.player.width, newX));
    this.player.y = Math.max(0, Math.min(screenHeight - this.player.height, newY));

    // Continuous shooting when mouse is held down or touch shoot button is pressed
    if (this.mouseDown || (this.touchControls && this.touchControls.shooting)) {
      this.shoot();
    }

    // Update shield status
    this.player.shielded = this.powerUpStates.shield.active;
    
    // Update touch controls visual state
    this.updateTouchControls();
  }

  shoot() {
    if (!this.gameRunning || !this.player) return;

    const currentTime = Date.now();
    const cooldown = this.powerUpStates.rapidFire.active
      ? 100
      : this.shootCooldown;

    if (currentTime - this.lastShot > cooldown) {
      // Responsive bullet sizing - smaller on mobile
      const isMobile = window.innerWidth <= 768;
      const bulletSize = isMobile ? 20 : 28; // Smaller on mobile
      
      const baseBullet = {
        x: this.player.x + this.player.width / 2 - bulletSize / 2, // Proper centering
        y: this.player.y,
        width: bulletSize,
        height: bulletSize,
        speed: 8,
        damage: this.powerUpStates.extraDamage.active
          ? this.baseDamage * 2
          : this.baseDamage,
        color: this.powerUpStates.extraDamage.active ? "#ff00ff" : "#00ffff",
        sprite: "bullet",
        isPlayerBullet: true,
      };

      // Create bullets based on upgrade level
      if (this.shipUpgrades.spread > 0) {
        // Spread shot - multiple bullets in different directions
        const spreadCount = 1 + this.shipUpgrades.spread; // 2-4 bullets
        const spreadAngle = 15; // degrees between bullets

        for (let i = 0; i < spreadCount; i++) {
          const bullet = { ...baseBullet };
          const angle = (i - (spreadCount - 1) / 2) * spreadAngle;
          const radians = (angle * Math.PI) / 180;

          bullet.dirX = Math.sin(radians);
          bullet.dirY = -Math.cos(radians); // Negative for upward movement
          bullet.x = this.player.x + this.player.width / 2 - bullet.width / 2;

          this.bullets.push(bullet);
        }
      } else {
        // Single bullet
        const bullet = { ...baseBullet };
        bullet.dirX = 0;
        bullet.dirY = -1;

        // Add homing capability if upgraded
        if (this.shipUpgrades.homing > 0) {
          bullet.isHoming = true;
          bullet.homingStrength = this.shipUpgrades.homing * 0.02; // 0.02, 0.04, 0.06
          bullet.target = null;
        }

        this.bullets.push(bullet);
      }

      this.lastShot = currentTime;

      // Play shoot sound
      if (this.audioEnabled) {
        this.shootSound.currentTime = 0;
        this.shootSound.play().catch(() => {});
      }

      // Create muzzle flash particles
      this.createMuzzleFlash(
        this.player.x + this.player.width / 2,
        this.player.y
      );
    }
  }

  chargeShoot() {
    if (!this.gameRunning || !this.player || !this.chargeShot.isReady) return;

    const currentTime = Date.now();
    if (currentTime - this.chargeShot.lastUsed < this.chargeShot.cooldown) {
      return; // Still on cooldown
    }

    // Responsive charge bullet sizing - smaller on mobile
    const isMobile = window.innerWidth <= 768;
    const chargeBulletSize = isMobile ? 45 : 64; // Smaller on mobile
    
    // Create powerful charge shot
    const chargeBullet = {
      x: this.player.x + this.player.width / 2 - chargeBulletSize / 2, // Proper centering
      y: this.player.y,
      width: chargeBulletSize,
      height: chargeBulletSize,
      speed: 5,
      damage: 15, // High damage
      color: "#ff0000",
      sprite: "powershot",
      isPlayerBullet: true,
      isChargeShot: true,
      dirX: 0,
      dirY: -1
    };

    this.bullets.push(chargeBullet);

    // Reset charge
    this.chargeShot.charge = 0;
    this.chargeShot.isReady = false;
    this.chargeShot.lastUsed = currentTime;

    // Update charge meter UI
    this.updateChargeMeter();

    // Play chargeshot sound
    if (this.audioEnabled) {
      this.chargeshotSound.currentTime = 0;
      this.chargeshotSound.play().catch(() => {});
    }

    // Create enhanced muzzle flash
    for (let i = 0; i < 10; i++) {
      this.createParticle(
        this.player.x + this.player.width / 2,
        this.player.y,
        Math.random() * 360,
        3 + Math.random() * 5,
        "#ff0000"
      );
    }

    // Screen shake for impact
    this.screenShake();
  }

  buildCharge(amount) {
    this.chargeShot.charge = Math.min(
      this.chargeShot.maxCharge,
      this.chargeShot.charge + amount
    );
    
    if (this.chargeShot.charge >= this.chargeShot.maxCharge) {
      this.chargeShot.isReady = true;
      
      // Visual feedback when charge is ready
      for (let i = 0; i < 5; i++) {
        this.createParticle(
          this.player.x + this.player.width / 2,
          this.player.y + this.player.height / 2,
          Math.random() * 360,
          2 + Math.random() * 3,
          "#ffff00"
        );
      }
    }
    
    // Update charge meter UI
    this.updateChargeMeter();
  }

  updateChargeMeter() {
    const chargeFill = document.getElementById("chargeMeterFill");
    if (chargeFill) {
      const chargePercent = (this.chargeShot.charge / this.chargeShot.maxCharge) * 100;
      chargeFill.style.width = chargePercent + "%";
      
      if (this.chargeShot.isReady) {
        chargeFill.classList.add("ready");
      } else {
        chargeFill.classList.remove("ready");
      }
    }
  }

  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      // Handle homing bullets
      if (bullet.isHoming && this.enemies.length > 0) {
        // Find closest enemy target
        if (!bullet.target || bullet.target.health <= 0) {
          let closestDistance = Infinity;
          bullet.target = null;

          this.enemies.forEach((enemy) => {
            const dist = Math.sqrt(
              Math.pow(enemy.x + enemy.width / 2 - bullet.x, 2) +
                Math.pow(enemy.y + enemy.height / 2 - bullet.y, 2)
            );
            if (dist < closestDistance) {
              closestDistance = dist;
              bullet.target = enemy;
            }
          });
        }

        // Adjust direction towards target
        if (bullet.target) {
          const targetX = bullet.target.x + bullet.target.width / 2;
          const targetY = bullet.target.y + bullet.target.height / 2;
          const deltaX = targetX - bullet.x;
          const deltaY = targetY - bullet.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          if (distance > 0) {
            const targetDirX = deltaX / distance;
            const targetDirY = deltaY / distance;

            // Gradually adjust direction (homing strength)
            bullet.dirX += (targetDirX - bullet.dirX) * bullet.homingStrength;
            bullet.dirY += (targetDirY - bullet.dirY) * bullet.homingStrength;

            // Normalize direction
            const length = Math.sqrt(
              bullet.dirX * bullet.dirX + bullet.dirY * bullet.dirY
            );
            bullet.dirX /= length;
            bullet.dirY /= length;
          }
        }
      }

      // Move bullet
      if (bullet.dirX !== undefined && bullet.dirY !== undefined) {
        // Directional movement (spread/homing bullets)
        bullet.x += bullet.dirX * bullet.speed;
        bullet.y += bullet.dirY * bullet.speed;
      } else {
        // Standard upward movement
        bullet.y -= bullet.speed;
      }

      // Remove bullets that are off screen
      const screenWidth = this.displayWidth || this.canvas.width;
      const screenHeight = this.displayHeight || this.canvas.height;

      if (
        bullet.y + bullet.height < 0 ||
        bullet.y > screenHeight ||
        bullet.x + bullet.width < 0 ||
        bullet.x > screenWidth
      ) {
        this.bullets.splice(i, 1);
      }
    }
  }

  enemyShoot(enemy) {
    if (!this.player) return;

    // Calculate direction towards player
    const deltaX =
      this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2);
    const deltaY =
      this.player.y + this.player.height / 2 - (enemy.y + enemy.height / 2);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Normalize direction
    const dirX = deltaX / distance;
    const dirY = deltaY / distance;

    // Responsive bullet sizing - smaller on mobile
    const isMobile = window.innerWidth <= 768;
    const bulletSize = isMobile ? 32 : 48; // Smaller on mobile

    const bullet = {
      x: enemy.x + enemy.width / 2 - bulletSize/2,
      y: enemy.y + enemy.height,
      width: bulletSize,
      height: bulletSize,
      speed: 4,
      dirX: dirX,
      dirY: dirY,
      color: "#ff4757",
      sprite: "firstbossbullet",
      isEnemyBullet: true
    };

    this.enemyBullets.push(bullet);

    // Play new enemy shoot sound (using first boss sound)
    if (this.audioEnabled) {
      this.enemyBullet.currentTime = 0;
      this.enemyBullet.play().catch(() => {});
    }
  }

  bossShoot(boss) {
    if (!this.player) return;

    // Responsive bullet sizing - smaller on mobile
    const isMobile = window.innerWidth <= 768;
    const bulletSize = isMobile ? 30 : 44; // Smaller on mobile

    // Reduced bullet spread for boss (3 bullets instead of 5)
    for (let i = -1; i <= 1; i++) {
      const angle = i * 70; // degrees - wider spread with fewer bullets
      const radians = (angle * Math.PI) / 180;

      const bullet = {
        x: boss.x + boss.width / 2 - bulletSize/2,
        y: boss.y + boss.height,
        width: bulletSize,
        height: bulletSize,
        speed: 4,
        dirX: Math.sin(radians),
        dirY: Math.cos(radians),
        color: "#ff1744",
        damage: boss.damage,
        sprite: boss.bulletSprite, // Use boss-specific bullet sprite
        isBossBullet: true,
      };

      this.enemyBullets.push(bullet);
    }

    // Play boss attack sound
    if (this.audioEnabled && boss.sound && this[boss.sound]) {
      this[boss.sound].currentTime = 0;
      this[boss.sound].play().catch(() => {});
    }
  }

  bossSpecialAttack(boss) {
    // Responsive bullet sizing - smaller on mobile
    const isMobile = window.innerWidth <= 768;
    const bulletSize = isMobile ? 30 : 44; // Smaller on mobile

    // Reduced circular bullet pattern (8 bullets instead of 12)
    for (let i = 0; i < 8; i++) {
      const angle = i * 45; // degrees - 45 degree spacing instead of 30
      const radians = (angle * Math.PI) / 180;

      const bullet = {
        x: boss.x + boss.width / 2 - bulletSize/2,
        y: boss.y + boss.height / 2,
        width: bulletSize,
        height: bulletSize,
        speed: 3.5,
        dirX: Math.sin(radians),
        dirY: Math.cos(radians),
        color: "#ffff00",
        damage: boss.damage,
        sprite: boss.bulletSprite, // Use boss-specific bullet sprite
        isBossBullet: true,
        isSpecial: true, // Mark as special attack bullet
      };

      this.enemyBullets.push(bullet);
    }

    // Play boss special attack sound
    if (this.audioEnabled && boss.sound && this[boss.sound]) {
      this[boss.sound].currentTime = 0;
      this[boss.sound].play().catch(() => {});
    }

    // Screen shake effect for special attack
    this.screenShake();
  }

  bossDefeated() {
    this.bossActive = false;
    this.currentBoss = null;
    this.roundInProgress = false;

    // Hide boss health bar
    this.hideBossHealthBar();
    
    // Stop boss intro music and resume background music
    if (this.audioEnabled) {
      this.bossIntroMusic.pause();
      this.bossIntroMusic.currentTime = 0;
      this.backgroundMusic.play().catch(() => {});
    }

    // Bonus score for defeating boss(es)
    const bossBonus = 500 * this.currentRound;
    this.score += bossBonus;
    this.updateScore();

    // Create celebration particles
    for (let i = 0; i < 30; i++) {
      this.createParticle(
        (this.displayWidth || this.canvas.width) / 2,
        (this.displayHeight || this.canvas.height) / 2,
        Math.random() * 360,
        4 + Math.random() * 6,
        ["#ffff00", "#ff6b6b", "#4ecdc4", "#ff00ff"][
          Math.floor(Math.random() * 4)
        ]
      );
    }

    // Show upgrade screen after short delay
    setTimeout(() => {
      this.showUpgradeScreen();
    }, 2000);
  }

  updateEnemyBullets() {
    const screenWidth = this.displayWidth || this.canvas.width;
    const screenHeight = this.displayHeight || this.canvas.height;

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const bullet = this.enemyBullets[i];

      // Move bullet in calculated direction
      bullet.x += bullet.dirX * bullet.speed;
      bullet.y += bullet.dirY * bullet.speed;

      // Remove bullets that are off screen
      if (
        bullet.y > screenHeight ||
        bullet.y < -bullet.height ||
        bullet.x < -bullet.width ||
        bullet.x > screenWidth
      ) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  spawnEnemy() {
    // Don't spawn regular enemies during boss fight or if round is not in progress
    if (this.bossActive || !this.roundInProgress) {
      return;
    }

    const currentTime = Date.now();
    const baseSpawnRate = this.enemySpawnRate;
    // Make base spawn rate even more aggressive with level progression
    const spawnRate = Math.max(200, baseSpawnRate - (this.level - 1) * 50); // Faster spawning

    if (currentTime - this.lastEnemySpawn > spawnRate) {
      const enemyTypes = [
        "enemyOne",
        "enemyTwo",
        "enemyThree",
        "enemyFour",
        "enemyFive",
        "enemySix",
      ];
      const randomType =
        enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const screenWidth = this.displayWidth || this.canvas.width;

      let enemy;
      switch (randomType) {
        case "enemyOne":
          enemy = {
            x: Math.random() * (screenWidth - 70),
            y: -70,
            width: 75,
            height: 75,
            speed: (2 + Math.random() * 2) * this.currentSpeedMultiplier,
            health: 1,
            score: Math.floor(10 * this.currentScoreMultiplier),
            type: "enemyOne",
            pattern: "straight",
          };
          break;
        case "enemyTwo":
          enemy = {
            x: Math.random() * (screenWidth - 80),
            y: -80,
            width: 75,
            height: 75,
            speed: (1.5 + Math.random() * 1.5) * this.currentSpeedMultiplier,
            health: 2,
            score: Math.floor(20 * this.currentScoreMultiplier),
            type: "enemyTwo",
            pattern: "zigzag",
            direction: Math.random() > 0.5 ? 1 : -1,
          };
          break;
        case "enemyThree":
          enemy = {
            x: Math.random() * (screenWidth - 85),
            y: -85,
            width: 80,
            height: 80,
            speed: (1 + Math.random()) * this.currentSpeedMultiplier,
            health: 3,
            score: Math.floor(30 * this.currentScoreMultiplier),
            type: "enemyThree",
            pattern: "circular",
            angle: 0,
          };
          break;
        case "enemyFour":
          enemy = {
            x: Math.random() * (screenWidth - 85),
            y: -85,
            width: 80,
            height: 80,
            speed: (1 + Math.random()) * this.currentSpeedMultiplier,
            health: 2,
            score: Math.floor(50 * this.currentScoreMultiplier),
            type: "enemyFour",
            pattern: "circular",
            angle: 0,
            lastShot: 0,
            shootCooldown: 1500 + Math.random() * 2000, // 1.5-2.5 seconds
          };
          break;
        case "enemyFive":
          enemy = {
            x: Math.random() * (screenWidth - 90),
            y: -90,
            width: 85,
            height: 85,
            speed: (1 + Math.random()) * this.currentSpeedMultiplier,
            health: 2,
            score: Math.floor(50 * this.currentScoreMultiplier),
            type: "enemyFive",
            pattern: "circular",
            angle: 0,
            lastShot: 0,
            shootCooldown: 1500 + Math.random() * 3000, // 1.5-2.5 seconds
          };
          break;
        case "enemySix":
          enemy = {
            x: Math.random() * (screenWidth - 90),
            y: -90,
            width: 85,
            height: 85,
            speed: (1 + Math.random()) * this.currentSpeedMultiplier,
            health: 2,
            score: Math.floor(50 * this.currentScoreMultiplier),
            type: "enemySix",
            pattern: "circular",
            angle: 0,
            lastShot: 0,
            shootCooldown: 1500 + Math.random() * 4000, // 1.5-2.5 seconds
          };
          break;
      }

      this.enemies.push(enemy);
      this.lastEnemySpawn = currentTime;
    }
  }

  spawnAnomalyEnemy() {
    const currentTime = Date.now();
    
    // Check if enough time has passed and random chance
    if (currentTime - this.lastAnomalySpawn > this.anomalySpawnRate && Math.random() < this.anomalyChance) {
      const screenWidth = this.displayWidth || this.canvas.width;
      const screenHeight = this.displayHeight || this.canvas.height;
      
      // Randomly choose left or right side
      const fromLeft = Math.random() < 0.5;
      const spawnY = Math.random() * (screenHeight * 0.6) + screenHeight * 0.2; // Middle 60% of screen height
      
      const anomaly = {
        x: fromLeft ? -80 : screenWidth + 20, // Start off-screen
        y: spawnY,
        width: 98,
        height: 98,
        speed: 2 + Math.random() * 1.5, // Slightly slower for more dramatic charging (2-3.5)
        health: 1,
        score: 500, // High score reward
        type: "secretenemy",
        pattern: "anomaly",
        direction: fromLeft ? 1 : -1, // 1 for right, -1 for left
        hasSpawned: false, // Track if spawn explosion happened
        isCharging: false // Track if actively charging player
      };
      
      this.enemies.push(anomaly);
      this.lastAnomalySpawn = currentTime;
      
      console.log(`Anomaly spawned from ${fromLeft ? 'left' : 'right'} side at y=${spawnY} - will charge at player after spawn effect`);
    }
  }

  updateEnemies() {
    const currentTime = Date.now();
    const screenHeight = this.displayHeight || this.canvas.height;
    const screenWidth = this.displayWidth || this.canvas.width;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Special boss behavior
      if (enemy.pattern === "boss") {
        // Boss movement pattern
        enemy.movementTimer += 0.02;

        // Horizontal movement
        enemy.x += Math.sin(enemy.movementTimer) * 2;

        // Vertical movement (enter screen slowly)
        if (enemy.y < 50) {
          enemy.y += enemy.speed * 0.5;
        } else {
          enemy.y += Math.sin(enemy.movementTimer * 0.5) * 0.5;
        }

        // Keep boss in bounds
        enemy.x = Math.max(0, Math.min(screenWidth - enemy.width, enemy.x));

        // Boss shooting
        if (currentTime - enemy.lastShot > enemy.shootCooldown) {
          this.bossShoot(enemy);
          enemy.lastShot = currentTime;
        }

        // Boss special attack
        if (
          currentTime - enemy.lastSpecialAttack >
          enemy.specialAttackCooldown
        ) {
          this.bossSpecialAttack(enemy);
          enemy.lastSpecialAttack = currentTime;
        }

        // Update boss health bar
        this.updateBossHealthBar();
      } else {
        // Regular enemy movement
        switch (enemy.pattern) {
          case "anomaly":
            // Create spawn explosion effect only once when entering screen
            if (!enemy.hasSpawned && 
                ((enemy.direction === 1 && enemy.x > -40) || 
                 (enemy.direction === -1 && enemy.x < screenWidth + 40))) {
              enemy.hasSpawned = true;
              enemy.isCharging = true; // Start charging after spawn
              this.createAnomalySpawnEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              
              // Lower background music and boss music volume for dramatic effect
              if (this.audioEnabled) {
                if (this.backgroundMusic && !this.backgroundMusic.paused) {
                  this.backgroundMusic.volume = 0.3; // Lower to 30% volume
                }
                if (this.bossIntroMusic && !this.bossIntroMusic.paused) {
                  this.bossIntroMusic.volume = 0.3; // Lower to 30% volume
                }
              }
              
              // Play anomaly sound
              if (this.audioEnabled) {
                this.secretEnemySound.currentTime = 0;
                this.secretEnemySound.play().catch(() => {});
              }
            }
            
            // Anomaly enemy movement behavior
            if (enemy.isCharging && this.player) {
              // Calculate direction towards player
              const deltaX = this.player.x + this.player.width / 2 - (enemy.x + enemy.width / 2);
              const deltaY = this.player.y + this.player.height / 2 - (enemy.y + enemy.height / 2);
              const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
              
              if (distance > 0) {
                // Normalize direction and apply speed
                const dirX = deltaX / distance;
                const dirY = deltaY / distance;
                
                // Move towards player (slower for more dramatic effect)
                enemy.x += dirX * enemy.speed * 0.8; // 80% of original speed
                enemy.y += dirY * enemy.speed * 0.8;
              }
            } else if (!enemy.hasSpawned) {
              // Continue horizontal movement until spawn effect triggers
              enemy.x += enemy.speed * enemy.direction;
            }
            
            // Remove when very far off screen
            if (enemy.x < -200 || enemy.x > screenWidth + 200 || 
                enemy.y < -200 || enemy.y > screenHeight + 200) {
              this.enemies.splice(i, 1);
              continue;
            }
            break;
          case "straight":
            enemy.y += enemy.speed;
            break;
          case "zigzag":
            enemy.y += enemy.speed;
            enemy.x += Math.sin(enemy.y * 0.02) * enemy.direction * 2;
            break;
          case "circular":
            enemy.y += enemy.speed;
            enemy.angle += 0.05;
            enemy.x += Math.sin(enemy.angle) * 3;
            break;
        }

        // EnemyFour shooting logic (non-boss)
        if (
          enemy.type === "enemyFour" &&
          this.player &&
          enemy.y > 0 &&
          enemy.y < screenHeight - 100
        ) {
          if (currentTime - enemy.lastShot > enemy.shootCooldown) {
            this.enemyShoot(enemy);
            enemy.lastShot = currentTime;
          }
        }
        if (
          enemy.type === "enemyFive" &&
          this.player &&
          enemy.y > 0 &&
          enemy.y < screenHeight - 100
        ) {
          if (currentTime - enemy.lastShot > enemy.shootCooldown) {
            this.enemyShoot(enemy);
            enemy.lastShot = currentTime;
          }
        }
        if (
          enemy.type === "enemySix" &&
          this.player &&
          enemy.y > 0 &&
          enemy.y < screenHeight - 100
        ) {
          if (currentTime - enemy.lastShot > enemy.shootCooldown) {
            this.enemyShoot(enemy);
            enemy.lastShot = currentTime;
          }
        }

        // Remove regular enemies that are off screen
        if (enemy.y > screenHeight) {
          this.enemies.splice(i, 1);
        }
      }
    }
  }

  checkCollisions() {
    // Bullet-Enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];

      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];

        if (this.isColliding(bullet, enemy)) {
          // Build charge for special attack based on damage dealt (excluding charge shots to prevent infinite loop)
          if (!bullet.isChargeShot) {
            this.buildCharge(bullet.damage * 0.5); // Build charge proportional to damage
          }

          // Damage enemy
          enemy.health -= bullet.damage;

          // Remove bullet
          this.bullets.splice(i, 1);

          // Create hit particles
          this.createHitParticles(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2
          );

          if (enemy.health <= 0) {
            // Enemy destroyed
            this.score += enemy.score;
            this.updateScore();

            // Check if it was a boss
            if (enemy.pattern === "boss") {
              // Create explosion
              this.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2
              );

              // Remove boss
              this.enemies.splice(j, 1);

              // Check if all bosses are defeated
              const remainingBosses = this.enemies.filter(
                (e) => e.pattern === "boss"
              );
              if (remainingBosses.length === 0) {
                this.bossDefeated();
              } else {
                // Update current boss reference
                this.currentBoss = remainingBosses[0];
              }
            } else {
              // Regular enemy killed - count towards round progress (except anomalies)
              if (enemy.pattern !== "anomaly") {
                this.roundEnemiesKilled++;

                // Check if round should end
                if (
                  this.roundEnemiesKilled >= this.roundEnemiesNeeded &&
                  !this.bossActive
                ) {
                  console.log(
                    `Round ${this.currentRound}: ${this.roundEnemiesKilled}/${this.roundEnemiesNeeded} enemies killed, spawning boss`
                  );
                  this.spawnBoss();
                }
              }

              // Special handling for anomaly enemies
              if (enemy.pattern === "anomaly") {
                // Create special hit effect
                this.createHitEffect(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2
                );
                
                // Stop background music temporarily for dramatic effect
                if (this.audioEnabled && this.backgroundMusic) {
                  this.backgroundMusic.pause();
                  
                  // Resume background music after 2 seconds with restored volume
                  setTimeout(() => {
                    if (this.audioEnabled && this.gameState === "playing") {
                      this.backgroundMusic.volume = 1.0; // Restore full volume
                      this.backgroundMusic.play().catch(() => {});
                    }
                  }, 2000);
                }
                
                // Restore boss music volume if it's playing
                if (this.audioEnabled && this.bossIntroMusic && !this.bossIntroMusic.paused) {
                  this.bossIntroMusic.volume = 1.0; // Restore full volume
                }
                
                // Stop secret enemy audio if it's still playing
                if (this.audioEnabled && this.secretEnemySound) {
                  this.secretEnemySound.pause();
                  this.secretEnemySound.currentTime = 0;
                }
                
                // Play pop sound when destroyed (not secret enemy sound)
                if (this.audioEnabled) {
                  this.popSound.currentTime = 0;
                  this.popSound.play().catch(() => {});
                }
                
                console.log('Anomaly enemy destroyed! Music paused temporarily. +500 points');
              }

              // Create explosion
              this.createExplosion(
                enemy.x + enemy.width / 2,
                enemy.y + enemy.height / 2
              );

              // Chance to spawn power-up (higher chance for anomalies)
              const powerupChance = enemy.pattern === "anomaly" ? 0.5 : 0.15;
              if (Math.random() < powerupChance) {
                this.spawnPowerUp(
                  enemy.x + enemy.width / 2,
                  enemy.y + enemy.height / 2
                );
              }

              // Remove enemy
              this.enemies.splice(j, 1);
            }

            // Play pop sound
            if (this.audioEnabled) {
              this.popSound.currentTime = 0;
              this.popSound.play().catch(() => {});
            }
          }

          break;
        }
      }
    }

    // Player-Enemy collisions
    if (this.player) {
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];

        if (this.isColliding(this.player, enemy)) {
          if (!this.player.shielded) {
            // Calculate damage (bosses do more damage)
            const damage = enemy.pattern === "boss" ? enemy.damage : 1;
            this.player.health -= damage;

            // Create explosion at player
            this.createExplosion(
              this.player.x + this.player.width / 2,
              this.player.y + this.player.height / 2
            );

            // Screen shake
            this.screenShake();

            // Check if player died
            if (this.player.health <= 0) {
              this.lives--;
              this.updateLives();

              if (this.lives <= 0) {
                this.gameOver();
                return;
              } else {
                // Respawn player with full health
                this.player.health = this.player.maxHealth;
              }
            }

            // Temporary invincibility
            this.player.shielded = true;
            setTimeout(() => {
              if (this.player && !this.powerUpStates.shield.active) {
                this.player.shielded = false;
              }
            }, 2000);
          }

          // Remove enemy if not boss
          if (enemy.pattern !== "boss") {
            this.enemies.splice(i, 1);

            // Create explosion
            this.createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2
            );
          }
        }
      }
    }

    // Player-PowerUp collisions
    if (this.player) {
      for (let i = this.powerups.length - 1; i >= 0; i--) {
        const powerup = this.powerups[i];

        if (this.isColliding(this.player, powerup)) {
          this.activatePowerUp(powerup.type);
          this.powerups.splice(i, 1);

          // Play powerup pickup sound
          if (this.audioEnabled) {
            this.powerupSound.currentTime = 0;
            this.powerupSound.play().catch(() => {});
          }
        }
      }
    }

    // Enemy bullet-Player collisions
    if (this.player) {
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = this.enemyBullets[i];

        if (this.isColliding(this.player, bullet)) {
          if (!this.player.shielded) {
            // Apply bullet damage
            const damage = bullet.damage || 1;
            this.player.health -= damage;

            // Create explosion at player
            this.createExplosion(
              this.player.x + this.player.width / 2,
              this.player.y + this.player.height / 2
            );

            // Screen shake
            this.screenShake();

            // Check if player died
            if (this.player.health <= 0) {
              this.lives--;
              this.updateLives();

              if (this.lives <= 0) {
                this.gameOver();
                return;
              } else {
                // Respawn player with full health
                this.player.health = this.player.maxHealth;
              }
            }

            // Temporary invincibility
            this.player.shielded = true;
            setTimeout(() => {
              if (this.player && !this.powerUpStates.shield.active) {
                this.player.shielded = false;
              }
            }, 2000);
          }

          // Remove enemy bullet
          this.enemyBullets.splice(i, 1);

          // Create hit particles
          this.createHitParticles(bullet.x, bullet.y);
        }
      }
    }
  }

  isColliding(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  spawnPowerUp(x, y) {
    const types = ["rapidFire", "shield", "extraDamage"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const powerup = {
      x: x - 20,
      y: y - 20,
      width: 40,
      height: 40,
      type: randomType,
      speed: 2,
      rotation: 0,
    };

    this.powerups.push(powerup);
  }

  updatePowerUps() {
    const screenHeight = this.displayHeight || this.canvas.height;

    // Update power-up positions
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.y += powerup.speed;
      powerup.rotation += 0.1;

      // Remove power-ups that are off screen
      if (powerup.y > screenHeight) {
        this.powerups.splice(i, 1);
      }
    }

    // Update power-up timers
    const currentTime = Date.now();
    Object.keys(this.powerUpStates).forEach((key) => {
      const powerUp = this.powerUpStates[key];
      if (powerUp.active) {
        if (currentTime > powerUp.timeLeft) {
          powerUp.active = false;
          powerUp.timeLeft = 0;

          // Special handling for shield
          if (key === "shield" && this.player) {
            this.player.shielded = false;
          }
        }
      }
    });

    this.updatePowerUpIndicators();
  }

  activatePowerUp(type) {
    const currentTime = Date.now();
    const powerUp = this.powerUpStates[type];

    powerUp.active = true;
    powerUp.timeLeft = currentTime + powerUp.duration;

    // Special handling for shield
    if (type === "shield" && this.player) {
      this.player.shielded = true;
    }

    this.updatePowerUpIndicators();
  }

  updatePowerUpIndicators() {
    Object.keys(this.powerUpStates).forEach((key) => {
      const indicator = document.getElementById(`${key}Indicator`);
      const powerUp = this.powerUpStates[key];

      // Check if indicator element exists
      if (!indicator) {
        console.warn(`Power-up indicator element not found: ${key}Indicator`);
        return;
      }

      if (powerUp.active) {
        indicator.classList.add("active");
        const timer = indicator.querySelector(".powerup-timer");
        if (timer) {
          const timeLeft = powerUp.timeLeft - Date.now();
          const percentage = Math.max(0, timeLeft / powerUp.duration);
          timer.style.setProperty("--duration", `${timeLeft}ms`);
        }
      } else {
        indicator.classList.remove("active");
      }
    });
  }

  updateLevel() {
    const newLevel = Math.floor(this.score / 500) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      document.getElementById("level").textContent = this.level;

      // Increase difficulty based on map settings
      const baseSpawnRate = this.maps[this.selectedMap].enemySpawnRate;
      this.enemySpawnRate = Math.max(
        800,
        baseSpawnRate - (this.level - 1) * 150
      );
    }
  }

  updateScore() {
    document.getElementById("score").textContent = this.score;
    this.updateLevel();
  }

  updateLives() {
    const livesContainer = document.getElementById("lives");
    livesContainer.innerHTML = "";

    for (let i = 0; i < this.lives; i++) {
      const heart = document.createElement("span");
      heart.className = "heart";
      heart.textContent = "♥";
      livesContainer.appendChild(heart);
    }
  }

  createExplosion(x, y) {
    const explosion = {
      x: x - 50,
      y: y - 50,
      size: 0,
      maxSize: 100,
      life: 500,
      startTime: Date.now(),
    };

    this.explosions.push(explosion);

    // Create explosion particles
    for (let i = 0; i < 10; i++) {
      this.createParticle(
        x,
        y,
        Math.random() * 360,
        2 + Math.random() * 4,
        "#ff6b6b"
      );
    }
  }

  createParticle(x, y, angle, speed, color) {
    const particle = {
      x: x,
      y: y,
      vx: Math.cos((angle * Math.PI) / 180) * speed,
      vy: Math.sin((angle * Math.PI) / 180) * speed,
      life: 300 + Math.random() * 200,
      startTime: Date.now(),
      color: color || "#00ffff",
      size: 2 + Math.random() * 3,
    };

    this.particles.push(particle);
  }

  createMuzzleFlash(x, y) {
    for (let i = 0; i < 5; i++) {
      this.createParticle(
        x,
        y,
        -90 + (Math.random() - 0.5) * 60,
        1 + Math.random() * 2,
        "#ffff00"
      );
    }
  }

  createHitParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      this.createParticle(
        x,
        y,
        Math.random() * 360,
        1 + Math.random() * 3,
        "#ff00ff"
      );
    }
  }

  createAnomalySpawnEffect(x, y) {
    // Create dramatic spawn explosion
    this.createExplosion(x, y);
    
    // Create additional particles for anomaly spawn
    for (let i = 0; i < 15; i++) {
      this.createParticle(
        x,
        y,
        Math.random() * 360,
        3 + Math.random() * 5,
        ["#ff0000", "#ffff00", "#ff00ff", "#00ffff"][Math.floor(Math.random() * 4)]
      );
    }
  }

  createHitEffect(x, y) {
    // Create hit effect animation
    const hitEffect = {
      x: x - 30,
      y: y - 30,
      width: 60,
      height: 60,
      life: 500,
      startTime: Date.now(),
      alpha: 1
    };
    
    this.hitEffects.push(hitEffect);
  }

  screenShake() {
    this.canvas.parentElement.classList.add("shake");
    setTimeout(() => {
      this.canvas.parentElement.classList.remove("shake");
    }, 500);
  }

  updateParticles() {
    const currentTime = Date.now();

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.1; // gravity

      if (currentTime - particle.startTime > particle.life) {
        this.particles.splice(i, 1);
      }
    }

    // Update explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const elapsed = currentTime - explosion.startTime;

      explosion.size = (elapsed / explosion.life) * explosion.maxSize;

      if (elapsed > explosion.life) {
        this.explosions.splice(i, 1);
      }
    }
  }

  updateHitEffects() {
    const currentTime = Date.now();

    // Update hit effects
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      const effect = this.hitEffects[i];
      const age = currentTime - effect.startTime;

      if (age > effect.life) {
        this.hitEffects.splice(i, 1);
      } else {
        // Fade out effect
        effect.alpha = 1 - (age / effect.life);
      }
    }
  }

  render() {
    const screenWidth = this.displayWidth || this.canvas.width;
    const screenHeight = this.displayHeight || this.canvas.height;

    // Set up crisp pixel-perfect rendering for all elements
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Clear canvas
    this.ctx.clearRect(0, 0, screenWidth, screenHeight);

    // Draw scrolling background
    const currentMapImage = this.images[`map_${this.selectedMap}`];
    if (currentMapImage && currentMapImage.complete) {
      // Ensure crisp rendering
      this.ctx.imageSmoothingEnabled = false;

      // Smooth continuous scrolling
      this.backgroundY += this.backgroundSpeed;

      // Calculate proper scaling to maintain aspect ratio while filling screen
      const imageAspectRatio =
        currentMapImage.naturalWidth / currentMapImage.naturalHeight;
      const screenAspectRatio = screenWidth / screenHeight;

      let renderWidth,
        renderHeight,
        offsetX = 0,
        offsetY = 0;

      if (imageAspectRatio > screenAspectRatio) {
        // Image is wider than screen - fit to height
        renderHeight = screenHeight;
        renderWidth = screenHeight * imageAspectRatio;
        offsetX = (screenWidth - renderWidth) / 2;
      } else {
        // Image is taller than screen - fit to width
        renderWidth = screenWidth;
        renderHeight = screenWidth / imageAspectRatio;
        offsetY = (screenHeight - renderHeight) / 2;
      }

      // Calculate background positions for seamless scrolling
      const bgY1 = (this.backgroundY % renderHeight) - renderHeight;
      const bgY2 = bgY1 + renderHeight;

      // Draw two copies of the background for seamless scrolling
      this.ctx.drawImage(
        currentMapImage,
        offsetX,
        offsetY + bgY1,
        renderWidth,
        renderHeight
      );
      this.ctx.drawImage(
        currentMapImage,
        offsetX,
        offsetY + bgY2,
        renderWidth,
        renderHeight
      );
      
      // Add atmospheric overlay effect
      this.drawBackgroundOverlay(screenWidth, screenHeight);
    }

    // Draw player
    if (
      this.player &&
      this.images.playerShip &&
      this.images.playerShip.complete
    ) {
      this.ctx.save();

      // Ensure crisp sprite rendering
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.webkitImageSmoothingEnabled = false;
      this.ctx.mozImageSmoothingEnabled = false;
      this.ctx.msImageSmoothingEnabled = false;

      // Shield effect
      if (this.player.shielded) {
        this.ctx.shadowColor = "#00ffff";
        this.ctx.shadowBlur = 20;
        this.ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() * 0.01);
      }
      
      // Add engine glow and movement animations
      this.drawPlayerWithEffects();
      
      this.ctx.restore();
    }

    // Draw bullets
    this.bullets.forEach((bullet) => {
      this.ctx.save();

      // Ensure crisp rendering
      this.ctx.imageSmoothingEnabled = false;

      // Use pixel-perfect positioning
      const bulletX = Math.floor(bullet.x);
      const bulletY = Math.floor(bullet.y);
      const bulletWidth = Math.floor(bullet.width);
      const bulletHeight = Math.floor(bullet.height);

      // Check if this is a player bullet with sprite
      if (
        bullet.isPlayerBullet &&
        bullet.sprite &&
        this.images[bullet.sprite] &&
        this.images[bullet.sprite].complete
      ) {
        // Add special effects for charge shot
        if (bullet.isChargeShot) {
          this.ctx.shadowColor = "#ff0000";
          this.ctx.shadowBlur = 20;
          this.ctx.globalAlpha = 0.9 + Math.sin(Date.now() * 0.01) * 0.1;
          
          // Create trail effect for charge shot
          for (let i = 0; i < 3; i++) {
            this.createParticle(
              bulletX + bulletWidth / 2,
              bulletY + bulletHeight,
              Math.random() * 360,
              1 + Math.random() * 2,
              "#ff4444"
            );
          }
        }
        // Add special effects for homing bullets
        else if (bullet.isHoming) {
          this.ctx.shadowColor = "#ff00ff";
          this.ctx.shadowBlur = 15;
          this.ctx.globalAlpha = 0.9;
        }

        // Draw player bullet sprite
        this.ctx.drawImage(
          this.images[bullet.sprite],
          bulletX,
          bulletY,
          bulletWidth,
          bulletHeight
        );
      } else {
        // Fallback to colored rectangle
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillRect(bulletX, bulletY, bulletWidth, bulletHeight);
      }

      this.ctx.restore();
    });

    // Draw enemy bullets
    this.enemyBullets.forEach((bullet) => {
      this.ctx.save();

      // Ensure crisp rendering
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.webkitImageSmoothingEnabled = false;
      this.ctx.mozImageSmoothingEnabled = false;
      this.ctx.msImageSmoothingEnabled = false;

      // Use pixel-perfect positioning
      const bulletX = Math.floor(bullet.x);
      const bulletY = Math.floor(bullet.y);
      const bulletWidth = Math.floor(bullet.width);
      const bulletHeight = Math.floor(bullet.height);

      // Check if this is a boss bullet with sprite
      if (
        bullet.isBossBullet &&
        bullet.sprite &&
        this.images[bullet.sprite] &&
        this.images[bullet.sprite].complete
      ) {
        // Draw boss bullet sprite
        this.ctx.drawImage(
          this.images[bullet.sprite],
          bulletX,
          bulletY,
          bulletWidth,
          bulletHeight
        );

        // Add glow effect for special attacks
        if (bullet.isSpecial) {
          this.ctx.shadowColor = bullet.color;
          this.ctx.shadowBlur = 10;
          this.ctx.globalAlpha = 0.8;
          this.ctx.drawImage(
            this.images[bullet.sprite],
            bulletX,
            bulletY,
            bulletWidth,
            bulletHeight
          );
        }
      } else if (
        bullet.isEnemyBullet &&
        bullet.sprite &&
        this.images[bullet.sprite] &&
        this.images[bullet.sprite].complete
      ) {
        // Draw enemy bullet sprite with red glow
        this.ctx.shadowColor = "#ff4757";
        this.ctx.shadowBlur = 8;
        this.ctx.globalAlpha = 0.9;
        this.ctx.drawImage(
          this.images[bullet.sprite],
          bulletX,
          bulletY,
          bulletWidth,
          bulletHeight
        );
        // Reset effects
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
      } else {
        // Draw regular colored bullet (fallback)
        this.ctx.fillStyle = bullet.color;
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 8;
        this.ctx.fillRect(bulletX, bulletY, bulletWidth, bulletHeight);
      }

      this.ctx.restore();
    });

    // Draw enemies
    this.enemies.forEach((enemy) => {
      const spriteKey = enemy.pattern === "boss" ? enemy.sprite : enemy.type;

      if (this.images[spriteKey] && this.images[spriteKey].complete) {
        this.ctx.save();

        // Ensure crisp sprite rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;

        // Add enhanced effects based on enemy type
        this.drawEnemyWithEffects(enemy, spriteKey);
        
        this.ctx.restore();
      }
    });

    // Draw power-ups
    this.powerups.forEach((powerup) => {
      this.ctx.save();

      // Ensure crisp rendering
      this.ctx.imageSmoothingEnabled = false;
      this.ctx.webkitImageSmoothingEnabled = false;
      this.ctx.mozImageSmoothingEnabled = false;
      this.ctx.msImageSmoothingEnabled = false;

      // Use pixel-perfect positioning
      const powerupX = Math.floor(powerup.x + powerup.width / 2);
      const powerupY = Math.floor(powerup.y + powerup.height / 2);

      this.ctx.translate(powerupX, powerupY);
      this.ctx.rotate(powerup.rotation);

      // Enhanced glow effect with type-specific colors and animation
      const time = Date.now() * 0.003;
      const pulseIntensity = 0.7 + Math.sin(time + powerup.rotation * 5) * 0.3;
      
      // Get type-specific glow color
      const glowColor = this.getPowerUpGlowColor(powerup.type);
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 20 * pulseIntensity;
      
      // Create outer glow ring
      this.ctx.beginPath();
      this.ctx.arc(0, 0, (powerup.width / 2) + 8, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${this.hexToRgb(glowColor)}, ${0.2 * pulseIntensity})`;
      this.ctx.fill();
      
      // Reset shadow for sprite rendering
      this.ctx.shadowBlur = 15 * pulseIntensity;

      // Draw power-up sprite image with pixel-perfect dimensions
      this.ctx.shadowBlur = 0;
      const halfWidth = Math.floor(powerup.width / 2);
      const halfHeight = Math.floor(powerup.height / 2);
      
      // Get the appropriate sprite image
      const spriteImage = this.getPowerUpSprite(powerup.type);
      if (spriteImage) {
        this.ctx.drawImage(
          spriteImage,
          -halfWidth,
          -halfHeight,
          powerup.width,
          powerup.height
        );
      } else {
        // Fallback to colored rectangle if image not found
        this.ctx.fillStyle = this.getPowerUpColor(powerup.type);
        this.ctx.fillRect(-halfWidth, -halfHeight, powerup.width, powerup.height);
        
        // Draw icon with crisp text rendering
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "16px Arial";
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillText(this.getPowerUpIcon(powerup.type), 0, 0);
      }

      this.ctx.restore();
    });

    // Draw particles
    this.particles.forEach((particle) => {
      const currentTime = Date.now();
      const age = currentTime - particle.startTime;
      const alpha = Math.max(0, 1 - age / particle.life);

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;

      // Use pixel-perfect positioning
      const particleX = Math.floor(particle.x);
      const particleY = Math.floor(particle.y);
      const particleSize = Math.floor(particle.size);

      this.ctx.beginPath();
      this.ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // Draw explosions
    this.explosions.forEach((explosion) => {
      const currentTime = Date.now();
      const progress = Math.min(
        1,
        (currentTime - explosion.startTime) / explosion.life
      );
      const alpha = 1 - progress;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;

      // Use pixel-perfect positioning
      const explosionX = Math.floor(explosion.x);
      const explosionY = Math.floor(explosion.y);
      const explosionSize = Math.floor(explosion.size);

      // Create gradient
      const gradient = this.ctx.createRadialGradient(
        explosionX + explosionSize / 2,
        explosionY + explosionSize / 2,
        0,
        explosionX + explosionSize / 2,
        explosionY + explosionSize / 2,
        explosionSize / 2
      );
      gradient.addColorStop(0, "#ffff00");
      gradient.addColorStop(0.5, "#ff6b6b");
      gradient.addColorStop(1, "transparent");

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(explosionX, explosionY, explosionSize, explosionSize);

      this.ctx.restore();
    });

    // Draw hit effects
    this.hitEffects.forEach((effect) => {
      if (this.images['hit-effect'] && this.images['hit-effect'].complete) {
        this.ctx.save();
        this.ctx.globalAlpha = effect.alpha;
        
        // Use pixel-perfect positioning
        const effectX = Math.floor(effect.x);
        const effectY = Math.floor(effect.y);
        
        this.ctx.drawImage(
          this.images['hit-effect'],
          effectX,
          effectY,
          effect.width,
          effect.height
        );
        
        this.ctx.restore();
      }
    });
  }

  getPowerUpGlowColor(type) {
    switch (type) {
      case "rapidFire":
        return "#ff4757"; // Red glow for rapid fire
      case "shield":
        return "#00d2d3"; // Cyan glow for shield
      case "extraDamage":
        return "#ff3838"; // Purple-red glow for extra damage
      default:
        return "#ffff00"; // Yellow default
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : "255, 255, 0";
  }

  getPowerUpSprite(type) {
    switch (type) {
      case "rapidFire":
        return this.images.rapidfire;
      case "shield":
        return this.images.shield;
      case "extraDamage":
        return this.images.extradamage;
      default:
        return null;
    }
  }

  getPowerUpColor(type) {
    switch (type) {
      case "rapidFire":
        return "#ff6b6b";
      case "shield":
        return "#4ecdc4";
      case "extraDamage":
        return "#ff9ff3";
      default:
        return "#ffff00";
    }
  }

  getPowerUpIcon(type) {
    switch (type) {
      case "rapidFire":
        return "🔥";
      case "shield":
        return "🛡";
      case "extraDamage":
        return "💥";
      default:
        return "?";
    }
  }

  gameLoop() {
    if (this.gameRunning && this.gameState === "playing") {
      this.updatePlayer();
      this.updateBullets();
      this.updateEnemyBullets();
      this.spawnEnemy();
      this.spawnAnomalyEnemy(); // Add anomaly spawning
      this.updateEnemies();
      this.updatePowerUps();
      this.updateParticles();
      this.updateHitEffects(); // Add hit effects update
      this.checkCollisions();
      this.updateChargeMeter();
    }

    if (this.gameState === "playing" || this.gameState === "paused") {
      this.render();
    }

    requestAnimationFrame(() => this.gameLoop());
  }
  
  // Enhanced rendering methods
  drawBackgroundOverlay(screenWidth, screenHeight) {
    const time = Date.now() * 0.001;
    
    // Add animated star field overlay
    this.ctx.save();
    this.ctx.globalAlpha = 0.6;
    
    // Create moving star particles
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(time * 0.5 + i) * screenWidth * 0.3 + screenWidth * 0.5) % screenWidth;
      const y = (time * 30 + i * 50) % (screenHeight + 100) - 50;
      const size = Math.sin(time * 2 + i) * 2 + 2;
      
      this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 3 + i) * 0.3})`;
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Add subtle gradient overlay for depth
    const gradient = this.ctx.createLinearGradient(0, 0, 0, screenHeight);
    gradient.addColorStop(0, 'rgba(0, 20, 40, 0.1)');
    gradient.addColorStop(0.5, 'rgba(0, 10, 30, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 5, 20, 0.3)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, screenWidth, screenHeight);
    
    this.ctx.restore();
  }
  
  drawPlayerWithEffects() {
    const time = Date.now() * 0.001;
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);
    const playerWidth = Math.floor(this.player.width * (this.scaleFactor || 1));
    const playerHeight = Math.floor(this.player.height * (this.scaleFactor || 1));
    
    // Engine thrust effect
    const isMoving = this.keys['ArrowLeft'] || this.keys['KeyA'] || 
                    this.keys['ArrowRight'] || this.keys['KeyD'] ||
                    this.keys['ArrowUp'] || this.keys['KeyW'] ||
                    this.keys['ArrowDown'] || this.keys['KeyS'] ||
                    (this.touchControls && this.touchControls.joystick.active);
    
    if (isMoving) {
      // Draw engine particles (no blur)
      this.ctx.save();
      this.ctx.globalAlpha = 0.8;
      
      // Engine particles
      for (let i = 0; i < 3; i++) {
        const engineX = Math.floor(playerX + playerWidth / 2 + (Math.random() - 0.5) * 20);
        const engineY = Math.floor(playerY + playerHeight + Math.random() * 10);
        const particleSize = Math.floor(Math.random() * 3 + 1);
        
        this.ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.8 + 0.2})`;
        this.ctx.beginPath();
        this.ctx.arc(engineX, engineY, particleSize, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
    
    // Draw ship with pixel-perfect crisp rendering - NO blur effects
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;
    
    // No shadow blur, no alpha animation, no hover offset for crisp rendering
    this.ctx.drawImage(
      this.images.playerShip,
      playerX,
      playerY,
      playerWidth,
      playerHeight
    );
    
    this.ctx.restore();
  }
  
  drawEnemyWithEffects(enemy, spriteKey) {
    const time = Date.now() * 0.001;
    const enemyX = Math.floor(enemy.x);
    const enemyY = Math.floor(enemy.y);
    const enemyWidth = Math.floor(enemy.width);
    const enemyHeight = Math.floor(enemy.height);
    
    // Enable crisp pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    
    // Boss effects (keep boss glow but reduce intensity)
    if (enemy.pattern === "boss") {
      this.ctx.shadowColor = "#ff1744";
      this.ctx.shadowBlur = 10;
      this.ctx.globalAlpha = 0.95;
      
      // Boss energy field (reduced intensity)
      this.ctx.save();
      this.ctx.globalAlpha = 0.2;
      this.ctx.strokeStyle = '#ff1744';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(
        enemyX + enemyWidth / 2, 
        enemyY + enemyHeight / 2, 
        enemyWidth / 2 + Math.sin(time * 2) * 3, 
        0, 
        Math.PI * 2
      );
      this.ctx.stroke();
      this.ctx.restore();
    } else {
      // Regular enemy effects - remove glow, keep animations
      switch (enemy.type) {
        case 'secretenemy':
          // Anomaly enemy special effects
          this.ctx.save();
          
          // Pulsing glow effect for anomaly
          const pulseAlpha = 0.3 + Math.sin(time * 4) * 0.2;
          this.ctx.shadowColor = "#ff0000";
          this.ctx.shadowBlur = 15;
          this.ctx.globalAlpha = 0.9;
          
          // Slightly larger size with pulsing
          const pulseScale = 1 + Math.sin(time * 3) * 0.1;
          this.ctx.translate(enemyX + enemyWidth / 2, enemyY + enemyHeight / 2);
          this.ctx.scale(pulseScale, pulseScale);
          
          this.ctx.drawImage(
            this.images[spriteKey],
            -enemyWidth / 2,
            -enemyHeight / 2,
            enemyWidth,
            enemyHeight
          );
          
          this.ctx.restore();
          return;
        case 'enemyTwo':
          // Keep rotation for enemyTwo but remove glow
          this.ctx.save();
          this.ctx.translate(enemyX + enemyWidth / 2, enemyY + enemyHeight / 2);
          this.ctx.rotate(time * 2);
          this.ctx.drawImage(
            this.images[spriteKey],
            -enemyWidth / 2,
            -enemyHeight / 2,
            enemyWidth,
            enemyHeight
          );
          this.ctx.restore();
          return;
        case 'enemyFive':
          // Keep scale pulsing but remove glow
          const scale = 1 + Math.sin(time * 3) * 0.05;
          this.ctx.save();
          this.ctx.translate(enemyX + enemyWidth / 2, enemyY + enemyHeight / 2);
          this.ctx.scale(scale, scale);
          this.ctx.drawImage(
            this.images[spriteKey],
            -enemyWidth / 2,
            -enemyHeight / 2,
            enemyWidth,
            enemyHeight
          );
          this.ctx.restore();
          return;
      }
    }
    
    // Default drawing with subtle hover effect
    const hoverOffset = Math.sin(time * 1.5 + enemy.x * 0.01) * 0.5;
    
    this.ctx.drawImage(
      this.images[spriteKey],
      enemyX,
      enemyY + hoverOffset,
      enemyWidth,
      enemyHeight
    );
  }
}

// Initialize game when page loads
document.addEventListener("DOMContentLoaded", () => {
  const game = new SpaceShooter();
  
  // Handle orientation change on mobile
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      if (game && typeof game.resizeCanvas === 'function') {
        game.resizeCanvas();
      }
    }, 100);
  });
  
  // Handle resize events
  window.addEventListener('resize', () => {
    if (game && typeof game.resizeCanvas === 'function') {
      game.resizeCanvas();
    }
  });
});
