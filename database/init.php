<?php
require_once '../config/database.php';

echo "Iniciando verificação do banco de dados...\n\n";

try {
    // Test database connection
    $conn = getConnection();
    echo "✓ Conexão com o banco de dados estabelecida com sucesso!\n";

    // Check if tables exist
    $tables = ['tecnicos', 'manutencoes', 'manutencao_tecnicos', 'checklist_items'];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows > 0) {
            echo "✓ Tabela '$table' encontrada\n";
            
            // Count records in table
            $count = $conn->query("SELECT COUNT(*) as total FROM $table")->fetch_assoc()['total'];
            echo "  └─ Registros encontrados: $count\n";
        } else {
            echo "✗ Tabela '$table' não encontrada\n";
        }
    }

    // Verify foreign key constraints
    echo "\nVerificando relações entre tabelas...\n";
    
    // Check manutencao_tecnicos relationships
    $sql = "SELECT 
                mt.manutencao_id,
                m.titulo as manutencao,
                t.nome as tecnico
            FROM manutencao_tecnicos mt
            JOIN manutencoes m ON mt.manutencao_id = m.id
            JOIN tecnicos t ON mt.tecnico_id = t.id
            LIMIT 5";
    
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        echo "✓ Relacionamentos entre manutenções e técnicos OK\n";
        while ($row = $result->fetch_assoc()) {
            echo "  └─ Manutenção '{$row['manutencao']}' atribuída a '{$row['tecnico']}'\n";
        }
    } else {
        echo "✗ Nenhum relacionamento entre manutenções e técnicos encontrado\n";
    }

    // Check checklist items relationships
    $sql = "SELECT 
                c.manutencao_id,
                m.titulo as manutencao,
                COUNT(*) as total_items
            FROM checklist_items c
            JOIN manutencoes m ON c.manutencao_id = m.id
            GROUP BY c.manutencao_id
            LIMIT 5";
    
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        echo "✓ Relacionamentos entre manutenções e checklist OK\n";
        while ($row = $result->fetch_assoc()) {
            echo "  └─ Manutenção '{$row['manutencao']}' tem {$row['total_items']} itens no checklist\n";
        }
    } else {
        echo "✗ Nenhum relacionamento entre manutenções e checklist encontrado\n";
    }

    // Verify indexes
    echo "\nVerificando índices...\n";
    $indexes = [
        'manutencoes' => ['idx_manutencoes_data_prevista', 'idx_manutencoes_status'],
        'tecnicos' => ['idx_tecnicos_disponibilidade'],
        'checklist_items' => ['idx_checklist_status']
    ];

    foreach ($indexes as $table => $tableIndexes) {
        $result = $conn->query("SHOW INDEX FROM $table");
        $foundIndexes = [];
        while ($row = $result->fetch_assoc()) {
            $foundIndexes[] = $row['Key_name'];
        }

        foreach ($tableIndexes as $index) {
            if (in_array($index, $foundIndexes)) {
                echo "✓ Índice '$index' encontrado na tabela '$table'\n";
            } else {
                echo "✗ Índice '$index' não encontrado na tabela '$table'\n";
            }
        }
    }

    echo "\nVerificação concluída com sucesso!\n";

} catch (Exception $e) {
    echo "Erro durante a verificação: " . $e->getMessage() . "\n";
}

// Close connection
if (isset($conn)) {
    $conn->close();
    echo "\nConexão com o banco de dados fechada.\n";
}
?>
