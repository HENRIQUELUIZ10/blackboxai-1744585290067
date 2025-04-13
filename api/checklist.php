<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['manutencao_id'])) {
            // Get checklist items for a specific maintenance
            $manutencaoId = $conn->real_escape_string($_GET['manutencao_id']);
            $sql = "SELECT * FROM checklist_items 
                    WHERE manutencao_id = '$manutencaoId' 
                    ORDER BY ordem";
            
            $result = $conn->query($sql);
            $items = [];
            
            while ($row = $result->fetch_assoc()) {
                $items[] = $row;
            }
            
            echo json_encode($items);
        } else if (isset($_GET['id'])) {
            // Get specific checklist item
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM checklist_items WHERE id = '$id'";
            
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                echo json_encode($result->fetch_assoc());
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Item não encontrado']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID da manutenção ou do item não fornecido']);
        }
        break;

    case 'POST':
        // Create new checklist item
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['manutencao_id']) || !isset($data['descricao'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados incompletos']);
            break;
        }
        
        $manutencaoId = $conn->real_escape_string($data['manutencao_id']);
        $descricao = $conn->real_escape_string($data['descricao']);
        $status = $conn->real_escape_string($data['status'] ?? 'pending');
        $comentarios = $conn->real_escape_string($data['comentarios'] ?? '');
        
        // Get next order number
        $sql = "SELECT MAX(ordem) as max_ordem FROM checklist_items WHERE manutencao_id = '$manutencaoId'";
        $result = $conn->query($sql);
        $row = $result->fetch_assoc();
        $ordem = ($row['max_ordem'] !== null) ? $row['max_ordem'] + 1 : 0;
        
        $sql = "INSERT INTO checklist_items (manutencao_id, descricao, status, comentarios, ordem) 
                VALUES ('$manutencaoId', '$descricao', '$status', '$comentarios', '$ordem')";
        
        if ($conn->query($sql)) {
            $data['id'] = $conn->insert_id;
            $data['ordem'] = $ordem;
            http_response_code(201);
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar item do checklist']);
        }
        break;

    case 'PUT':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $updates = [];
        if (isset($data['descricao'])) {
            $updates[] = "descricao = '" . $conn->real_escape_string($data['descricao']) . "'";
        }
        if (isset($data['status'])) {
            $updates[] = "status = '" . $conn->real_escape_string($data['status']) . "'";
        }
        if (isset($data['comentarios'])) {
            $updates[] = "comentarios = '" . $conn->real_escape_string($data['comentarios']) . "'";
        }
        if (isset($data['ordem'])) {
            $updates[] = "ordem = " . $conn->real_escape_string($data['ordem']);
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum dado para atualizar']);
            break;
        }
        
        $sql = "UPDATE checklist_items SET " . implode(', ', $updates) . " WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            // Get updated item
            $sql = "SELECT * FROM checklist_items WHERE id = '$id'";
            $result = $conn->query($sql);
            echo json_encode($result->fetch_assoc());
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao atualizar item']);
        }
        break;

    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        
        // Get item info for reordering
        $sql = "SELECT manutencao_id, ordem FROM checklist_items WHERE id = '$id'";
        $result = $conn->query($sql);
        
        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Item não encontrado']);
            break;
        }
        
        $item = $result->fetch_assoc();
        
        $conn->begin_transaction();
        
        try {
            // Delete the item
            $sql = "DELETE FROM checklist_items WHERE id = '$id'";
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao excluir item");
            }
            
            // Reorder remaining items
            $sql = "UPDATE checklist_items 
                    SET ordem = ordem - 1 
                    WHERE manutencao_id = '{$item['manutencao_id']}' 
                    AND ordem > {$item['ordem']}";
            if (!$conn->query($sql)) {
                throw new Exception("Erro ao reordenar itens");
            }
            
            $conn->commit();
            echo json_encode(['message' => 'Item excluído com sucesso']);
            
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
