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
        if (isset($_GET['id'])) {
            // Get specific technician
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM tecnicos WHERE id = '$id'";
            $result = $conn->query($sql);
            
            if ($result->num_rows > 0) {
                echo json_encode($result->fetch_assoc());
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Técnico não encontrado']);
            }
        } else {
            // Get all technicians
            $sql = "SELECT * FROM tecnicos ORDER BY nome";
            $result = $conn->query($sql);
            $tecnicos = [];
            
            while ($row = $result->fetch_assoc()) {
                $tecnicos[] = $row;
            }
            
            echo json_encode($tecnicos);
        }
        break;

    case 'POST':
        // Create new technician
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['nome']) || !isset($data['especialidade']) || 
            !isset($data['telefone']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dados incompletos']);
            break;
        }
        
        $nome = $conn->real_escape_string($data['nome']);
        $especialidade = $conn->real_escape_string($data['especialidade']);
        $telefone = $conn->real_escape_string($data['telefone']);
        $email = $conn->real_escape_string($data['email']);
        $disponibilidade = $conn->real_escape_string($data['disponibilidade'] ?? 'available');
        $observacoes = $conn->real_escape_string($data['observacoes'] ?? '');
        
        $sql = "INSERT INTO tecnicos (nome, especialidade, telefone, email, disponibilidade, observacoes) 
                VALUES ('$nome', '$especialidade', '$telefone', '$email', '$disponibilidade', '$observacoes')";
        
        if ($conn->query($sql)) {
            $data['id'] = $conn->insert_id;
            http_response_code(201);
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao criar técnico']);
        }
        break;

    case 'PUT':
        // Update technician
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $updates = [];
        if (isset($data['nome'])) {
            $updates[] = "nome = '" . $conn->real_escape_string($data['nome']) . "'";
        }
        if (isset($data['especialidade'])) {
            $updates[] = "especialidade = '" . $conn->real_escape_string($data['especialidade']) . "'";
        }
        if (isset($data['telefone'])) {
            $updates[] = "telefone = '" . $conn->real_escape_string($data['telefone']) . "'";
        }
        if (isset($data['email'])) {
            $updates[] = "email = '" . $conn->real_escape_string($data['email']) . "'";
        }
        if (isset($data['disponibilidade'])) {
            $updates[] = "disponibilidade = '" . $conn->real_escape_string($data['disponibilidade']) . "'";
        }
        if (isset($data['observacoes'])) {
            $updates[] = "observacoes = '" . $conn->real_escape_string($data['observacoes']) . "'";
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'Nenhum dado para atualizar']);
            break;
        }
        
        $sql = "UPDATE tecnicos SET " . implode(', ', $updates) . " WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            // Get updated technician
            $sql = "SELECT * FROM tecnicos WHERE id = '$id'";
            $result = $conn->query($sql);
            echo json_encode($result->fetch_assoc());
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao atualizar técnico']);
        }
        break;

    case 'DELETE':
        // Delete technician
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID não fornecido']);
            break;
        }
        
        $id = $conn->real_escape_string($_GET['id']);
        
        // Check if technician exists
        $sql = "SELECT id FROM tecnicos WHERE id = '$id'";
        $result = $conn->query($sql);
        
        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Técnico não encontrado']);
            break;
        }
        
        $sql = "DELETE FROM tecnicos WHERE id = '$id'";
        
        if ($conn->query($sql)) {
            echo json_encode(['message' => 'Técnico excluído com sucesso']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Erro ao excluir técnico']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método não permitido']);
        break;
}

$conn->close();
?>
