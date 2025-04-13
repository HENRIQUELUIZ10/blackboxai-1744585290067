-- Create database if not exists
CREATE DATABASE IF NOT EXISTS manutencao_preventiva
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE manutencao_preventiva;

-- Create technicians table
CREATE TABLE IF NOT EXISTS tecnicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    disponibilidade ENUM('available', 'busy', 'vacation', 'leave') DEFAULT 'available',
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create maintenance table
CREATE TABLE IF NOT EXISTS manutencoes (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create maintenance_technicians relationship table
CREATE TABLE IF NOT EXISTS manutencao_tecnicos (
    manutencao_id INT,
    tecnico_id INT,
    PRIMARY KEY (manutencao_id, tecnico_id),
    FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE CASCADE,
    FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create checklist items table
CREATE TABLE IF NOT EXISTS checklist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    manutencao_id INT,
    descricao TEXT NOT NULL,
    status ENUM('pending', 'completed', 'not-applicable') DEFAULT 'pending',
    comentarios TEXT,
    ordem INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manutencao_id) REFERENCES manutencoes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing

-- Insert technicians
INSERT INTO tecnicos (nome, especialidade, telefone, email, disponibilidade, observacoes) VALUES
('João Silva', 'Mecânica Industrial', '(11) 98765-4321', 'joao.silva@email.com', 'available', 'Especialista em manutenção de máquinas industriais'),
('Maria Santos', 'Elétrica', '(11) 97654-3210', 'maria.santos@email.com', 'available', 'Especialista em instalações elétricas industriais'),
('Pedro Oliveira', 'Hidráulica', '(11) 96543-2109', 'pedro.oliveira@email.com', 'busy', 'Especialista em sistemas hidráulicos');

-- Insert maintenances
INSERT INTO manutencoes (titulo, descricao, data_prevista, periodicidade, local, status, observacoes) VALUES
('Manutenção Preventiva - Máquina 01', 'Verificação geral e lubrificação dos componentes mecânicos', '2024-01-15', 'monthly', 'Sala de Máquinas', 'completed', 'Manutenção realizada conforme cronograma'),
('Inspeção Elétrica - Painel Principal', 'Verificação das conexões e medição de tensão', '2024-01-20', 'quarterly', 'Painel Elétrico Principal', 'pending', 'Necessário desligar energia para inspeção'),
('Manutenção Sistema Hidráulico', 'Verificação de vazamentos e pressão do sistema', '2024-01-25', 'monthly', 'Sistema Hidráulico Central', 'in-progress', 'Em andamento - verificação de pressão');

-- Insert maintenance-technician relationships
INSERT INTO manutencao_tecnicos (manutencao_id, tecnico_id) VALUES
(1, 1), -- João Silva na Manutenção Preventiva
(2, 2), -- Maria Santos na Inspeção Elétrica
(3, 3); -- Pedro Oliveira na Manutenção Hidráulica

-- Insert checklist items
INSERT INTO checklist_items (manutencao_id, descricao, status, comentarios, ordem) VALUES
(1, 'Verificar nível de óleo', 'completed', 'Nível adequado', 1),
(1, 'Lubrificar rolamentos', 'completed', 'Lubrificação realizada', 2),
(1, 'Verificar alinhamento', 'completed', 'Alinhamento correto', 3),
(2, 'Medir tensão nas fases', 'pending', NULL, 1),
(2, 'Verificar conexões', 'pending', NULL, 2),
(2, 'Testar disjuntores', 'pending', NULL, 3),
(3, 'Verificar pressão do sistema', 'completed', 'Pressão normal', 1),
(3, 'Identificar vazamentos', 'in-progress', 'Em verificação', 2),
(3, 'Testar válvulas', 'pending', NULL, 3);

-- Create indexes for better performance
CREATE INDEX idx_manutencoes_data_prevista ON manutencoes(data_prevista);
CREATE INDEX idx_manutencoes_status ON manutencoes(status);
CREATE INDEX idx_tecnicos_disponibilidade ON tecnicos(disponibilidade);
CREATE INDEX idx_checklist_status ON checklist_items(status);
