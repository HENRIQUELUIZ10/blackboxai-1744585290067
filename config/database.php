<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'manutencao_preventiva');

// Create connection
function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS);
    
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    // Create database if not exists
    $sql = "CREATE DATABASE IF NOT EXISTS " . DB_NAME;
    if ($conn->query($sql) === FALSE) {
        die("Error creating database: " . $conn->error);
    }
    
    // Select the database
    $conn->select_db(DB_NAME);
    
    // Set charset
    $conn->set_charset("utf8mb4");
    
    return $conn;
}

// Create database tables if they don't exist
function initDatabase() {
    $conn = getConnection();
    
    // Create technicians table
    $sql = "CREATE TABLE IF NOT EXISTS tecnicos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        especialidade VARCHAR(100) NOT NULL,
        telefone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        disponibilidade ENUM('available', 'busy', 'vacation', 'leave') DEFAULT 'available',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    if ($conn->query($sql) === FALSE) {
        die("Error creating technicians table: " . $conn->error);
    }
    
    // Create maintenance table
    $sql = "CREATE TABLE IF NOT EXISTS manutencoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descricao TEXT NOT NULL,
        data_prevista DATE NOT NULL,
        periodicidade VARCHAR(50),
        local VARCHAR(200) NOT NULL,
        status ENUM('pending', 'in-progress', 'completed', 'delayed') DEFAULT 'pending',
        observacoes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )";
    
    if ($conn->query($sql) === FALSE) {
        die("Error creating maintenance table: " . $conn->error);
    }
    
    // Create maintenance_technicians table (relationship table)
    $sql = "CREATE TABLE IF NOT EXISTS manutencao_tecnicos (
        manutencao_id INT,
        tecnico_id INT,
        PRIMARY KEY (manutencao_id, tecnico_id),
        FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE CASCADE,
        FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($sql) === FALSE) {
        die("Error creating maintenance_technicians table: " . $conn->error);
    }
    
    // Create checklist table
    $sql = "CREATE TABLE IF NOT EXISTS checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manutencao_id INT,
        descricao TEXT NOT NULL,
        status ENUM('pending', 'completed', 'not-applicable') DEFAULT 'pending',
        comentarios TEXT,
        ordem INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE CASCADE
    )";
    
    if ($conn->query($sql) === FALSE) {
        die("Error creating checklist table: " . $conn->error);
    }
    
    $conn->close();
}

// Initialize the database
initDatabase();
?>
