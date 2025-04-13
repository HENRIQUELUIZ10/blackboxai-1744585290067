<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper function to get technicians for a maintenance
function getTechnicians($conn, $manutencaoId) {
    $sql = "SELECT t.* FROM tecnicos t 
            INNER JOIN manutencao_tecnicos mt ON t.id = mt.tecnico_id 
            WHERE mt.manutencao_id = '$manutencaoId'";
    $result = $conn->query($sql);
    $technicians = [];
    while ($row = $result->fetch_assoc()) {
        $technicians[] = $row;
    }
    return $technicians;
}

// Helper function to get checklist items for a maintenance
function getChecklistItems($conn, $manutencaoId) {
    $sql = "SELECT * FROM checklist_items WHERE manutencao_id = '$manutencaoId' ORDER BY ordem";
    $result = $conn->query($sql);
    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }
    return $items;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Get specific maintenance
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM manutencoes WHERE id = '$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                $maintenance = $result->fetch_assoc();
                $maintenance['tecnicos'] = getTechnicians($conn, $id);
                $maintenance['checklist'] = getChecklistItems($conn, $id);
                echo json_encode($maintenance);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Manutenção não encontrada']);
            }
        } else {
            // Get all maintenances with optional filters
            $where = [];
            if (isset($_GET['status'])) {
                $status = $conn->real_escape_string($_GET['status']);
                $where[] = "status = '$status'";
            }
            if (isset($_GET['data_inicio']) && isset($_GET['data_fim'])) {
                $dataInicio = $conn->real_escape_string($_GET['data_inicio']);
                $dataFim = $conn->real_escape_string($_GET['data_fim']);
                $where[] = "data_prevista BETWEEN '$dataInicio' AND '$dataFim'";
            }
            if (isset($_GET['tecnico_id'])) {
                $tecnicoId = $conn->real_escape_string($_GET['tecnico_id']);
                $where[] = "id IN (SELECT manutencao_id FROM manutencao_tecnicos WHERE tecnico_id = '$tecnicoId')";
            }

            $sql = "SELECT * FROM manutencoes";
            if (!empty($where)) {
                $sql .= " WHERE " . implode(' AND ', $where);
            }
            $sql .= " ORDER BY data_prevista DESC";

            $result = $conn->query($sql);
            $manutencoes = [];
            
            while ($row = $result->fetch_assoc()) {
                $row['tecnicos'] = getTechnicians($conn, $row['id']);
                $row['checklist'] = getChecklistItems($conn, $row['id']);
                $manutencoes[] = $row;
            }
            
            echo json_encode($manutencoes);
        }
        break;

    case 'POST':
        // Create new maintenance
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['titulo']) || !isset($data['descricao']) || 
            !isset($data['data_prevista']) || !isset($data['local'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados incompletos']);
            break;
        }
        
        $conn->begin_transaction();
        
        try {
            // Insert maintenance
            $titulo = $conn->real_escape_string($data['titulo']);
            $descricao = $conn->real_escape_string($data['descricao']);
            $dataPrevista = $conn->real_escape_string($data['data_prevista']);
            $periodicidade = $conn->real_escape_string($data['periodicidade'] ?? '');
            $local = $conn->real_escape_string($data['local']);
            $status = $conn->real_escape_string($data['status'] ?? 'pending');
            $observacoes = $conn->real_escape_string($data['observacoes'] ?? '');
            
            $sql = "INSERT INTO manutencoes (titulo, descricao, data_prevista, periodicidade, local, status, observacoes) 
                    VALUES ('$titulo', '$descricao', '$dataPrevista', '$periodicidade', '$local', '$status', '$observacoes')";
            
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao criar manutenção");
            }
            
            $manutencaoId = $conn->insert_id;
            
            // Associate technicians
            if (isset($data['tecnicos']) && is_array($data['tecnicos'])) {
                foreach ($data['tecnicos'] as $tecnicoId) {
                    $tecnicoId = $conn->real_escape_string($tecnicoId);
                    $sql = "INSERT INTO manutencao_tecnicos (manutencao_id, tecnico_id) VALUES ('$manutencaoId', '$tecnicoId')";
                    if (!$conn->query($sql)) {
                        throw new Exception("Erro ao associar técnico");
                    }
                }
            }
            
            // Create checklist items
            if (isset($data['checklist']) && is_array($data['checklist'])) {
                foreach ($data['checklist'] as $index => $item) {
                    $descricao = $conn->real_escape_string($item['descricao']);
                    $sql = "INSERT INTO checklist_items (manutencao_id, descricao, ordem) 
                            VALUES ('$manutencaoId', '$descricao', '$index')";
                    if (!$conn->query($sql)) {
                        throw new Exception("Erro ao criar item do checklist");
                    }
                }
            }
            
            $conn->commit();
            
            // Return created maintenance with relationships
            $sql = "SELECT * FROM manutencoes WHERE id = '$manutencaoId'";
            $result = $conn->query($sql);
            $maintenance = $result->fetch_assoc();
            $maintenance['tecnicos'] = getTechnicians($conn, $manutencaoId);
            $maintenance['checklist'] = getChecklistItems($conn, $manutencaoId);
            
            http_response_code(201);
            echo json_encode($maintenance);
            
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Update maintenance
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $conn->begin_transaction();
        
        try {
            $updates = [];
            if (isset($data['titulo'])) {
                $updates[] = "titulo = '" . $conn->real_escape_string($data['titulo']) . "'";
            }
            if (isset($data['descricao'])) {
                $updates[] = "descricao = '" . $conn->real_escape_string($data['descricao']) . "'";
            }
            if (isset($data['data_prevista'])) {
                $updates[] = "data_prevista = '" . $conn->real_escape_string($data['data_prevista']) . "'";
            }
            if (isset($data['periodicidade'])) {
                $updates[] = "periodicidade = '" . $conn->real_escape_string($data['periodicidade']) . "'";
            }
            if (isset($data['local'])) {
                $updates[] = "local = '" . $conn->real_escape_string($data['local']) . "'";
            }
            if (isset($data['status'])) {
                $updates[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
            }
            if (isset($data['observacoes'])) {
                $updates[] = "observacoes = '" . $conn->real_escape_string($data['observacoes']) . "'";
            }
            
            if (!empty($updates)) {
                $sql = "UPDATE manutencoes SET " . implode(', ', $updates) . " WHERE id = '$id'";
                if (!$conn->query($sql)) {
                    throw new Exception("Erro ao atualizar manutenção");
                }
            }
            
            // Update technicians
            if (isset($data['tecnicos'])) {
                // Remove existing associations
                $sql = "DELETE FROM manutencao_tecnicos WHERE manutencao_id = '$id'";
                if (!$conn->query($sql)) {
                    throw new Exception("Erro ao atualizar técnicos");
                }
                
                // Add new associations
                foreach ($data['tecnicos'] as $tecnicoId) {
                    $tecnicoId = $conn->real_escape_string($tecnicoId);
                    $sql = "INSERT INTO manutencao_tecnicos (manutencao_id, tecnico_id) VALUES ('$id', '$tecnicoId')";
                    if (!$conn->query($sql)) {
                        throw new Exception("Erro ao associar técnico");
                    }
                }
            }
            
            // Update checklist items
            if (isset($data['checklist'])) {
                // Remove existing items
                $sql = "DELETE FROM checklist_items WHERE manutencao_id = '$id'";
                if (!$conn->query($sql)) {
                    throw new Exception("Erro ao atualizar checklist");
                }
                
                // Add new items
                foreach ($data['checklist'] as $index => $item) {
                    $descricao = $conn->real_escape_string($item['descricao']);
                    $status = $conn->real_escape_string($item['status'] ?? 'pending');
                    $comentarios = $conn->real_escape_string($item['comentarios'] ?? '');
                    
                    $sql = "INSERT INTO checklist_items (manutencao_id, descricao, status, comentarios, ordem) 
                            VALUES ('$id', '$descricao', '$status', '$comentarios', '$index')";
                    if (!$conn->query($sql)) {
                        throw new Exception("Erro ao criar item do checklist");
                    }
                }
            }
            
            $conn->commit();
            
            // Return updated maintenance with relationships
            $sql = "SELECT * FROM manutencoes WHERE id = '$id'";
            $result = $conn->query($sql);
            $maintenance = $result->fetch_assoc();
            $maintenance['tecnicos'] = getTechnicians($conn, $id);
            $maintenance['checklist'] = getChecklistItems($conn, $id);
            
            echo json_encode($maintenance);
            
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete maintenance
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        
        $conn->begin_transaction();
        
        try {
            // Delete associated records first
            $sql = "DELETE FROM manutencao_tecnicos WHERE manutencao_id = '$id'";
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao excluir associações com técnicos");
            }
            
            $sql = "DELETE FROM checklist_items WHERE manutencao_id = '$id'";
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao excluir itens do checklist");
            }
            
            // Delete maintenance
            $sql = "DELETE FROM manutencoes WHERE id = '$id'";
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao excluir manutenção");
            }
            
            $conn->commit();
            echo json_encode(['message' => 'Manutenção excluída com sucesso']);
            
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}

$conn->close();
?>
