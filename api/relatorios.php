<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

$conn = getConnection();

// Helper function to get maintenance statistics
function getStatistics($conn) {
    $stats = [
        'total' => 0,
        'pending' => 0,
        'completed' => 0,
        'delayed' => 0,
        'in_progress' => 0,
        'technicians_count' => 0,
        'locations_count' => 0
    ];
    
    // Get maintenance counts by status
    $sql = "SELECT status, COUNT(*) as count FROM manutencoes GROUP BY status";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        switch ($row['status']) {
            case 'pending':
                $stats['pending'] = (int)$row['count'];
                break;
            case 'completed':
                $stats['completed'] = (int)$row['count'];
                break;
            case 'delayed':
                $stats['delayed'] = (int)$row['count'];
                break;
            case 'in-progress':
                $stats['in_progress'] = (int)$row['count'];
                break;
        }
    }
    
    $stats['total'] = $stats['pending'] + $stats['completed'] + $stats['delayed'] + $stats['in_progress'];
    
    // Get technicians count
    $sql = "SELECT COUNT(*) as count FROM tecnicos";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    $stats['technicians_count'] = (int)$row['count'];
    
    // Get unique locations count
    $sql = "SELECT COUNT(DISTINCT local) as count FROM manutencoes";
    $result = $conn->query($sql);
    $row = $result->fetch_assoc();
    $stats['locations_count'] = (int)$row['count'];
    
    return $stats;
}

// Helper function to get maintenance history
function getMaintenanceHistory($conn, $startDate = null, $endDate = null) {
    $where = [];
    if ($startDate) {
        $startDate = $conn->real_escape_string($startDate);
        $where[] = "data_prevista >= '$startDate'";
    }
    if ($endDate) {
        $endDate = $conn->real_escape_string($endDate);
        $where[] = "data_prevista <= '$endDate'";
    }
    
    $sql = "SELECT 
                m.*, 
                GROUP_CONCAT(t.nome) as technicians
            FROM manutencoes m
            LEFT JOIN manutencao_tecnicos mt ON m.id = mt.manutencao_id
            LEFT JOIN tecnicos t ON mt.tecnico_id = t.id
            " . (!empty($where) ? " WHERE " . implode(' AND ', $where) : "") . "
            GROUP BY m.id
            ORDER BY m.data_prevista DESC";
    
    $result = $conn->query($sql);
    $maintenances = [];
    while ($row = $result->fetch_assoc()) {
        $maintenances[] = $row;
    }
    
    return $maintenances;
}

// Helper function to get technician performance
function getTechnicianPerformance($conn) {
    $sql = "SELECT 
                t.id,
                t.nome,
                t.especialidade,
                COUNT(mt.manutencao_id) as total_maintenances,
                SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END) as completed_maintenances,
                SUM(CASE WHEN m.status = 'delayed' THEN 1 ELSE 0 END) as delayed_maintenances
            FROM tecnicos t
            LEFT JOIN manutencao_tecnicos mt ON t.id = mt.tecnico_id
            LEFT JOIN manutencoes m ON mt.manutencao_id = m.id
            GROUP BY t.id
            ORDER BY total_maintenances DESC";
    
    $result = $conn->query($sql);
    $performance = [];
    while ($row = $result->fetch_assoc()) {
        $performance[] = $row;
    }
    
    return $performance;
}

// Helper function to get location statistics
function getLocationStatistics($conn) {
    $sql = "SELECT 
                local,
                COUNT(*) as total_maintenances,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_maintenances,
                SUM(CASE WHEN status = 'delayed' THEN 1 ELSE 0 END) as delayed_maintenances
            FROM manutencoes
            GROUP BY local
            ORDER BY total_maintenances DESC";
    
    $result = $conn->query($sql);
    $locations = [];
    while ($row = $result->fetch_assoc()) {
        $locations[] = $row;
    }
    
    return $locations;
}

// Main request handling
$type = $_GET['type'] ?? 'general';
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;

switch ($type) {
    case 'general':
        // General statistics
        $response = [
            'statistics' => getStatistics($conn),
            'recent_maintenances' => getMaintenanceHistory($conn, date('Y-m-d', strtotime('-30 days')))
        ];
        break;
        
    case 'maintenance_history':
        // Detailed maintenance history
        $response = [
            'maintenances' => getMaintenanceHistory($conn, $startDate, $endDate)
        ];
        break;
        
    case 'technician_performance':
        // Technician performance statistics
        $response = [
            'technicians' => getTechnicianPerformance($conn)
        ];
        break;
        
    case 'location_statistics':
        // Location-based statistics
        $response = [
            'locations' => getLocationStatistics($conn)
        ];
        break;
        
    case 'full_report':
        // Comprehensive report with all statistics
        $response = [
            'statistics' => getStatistics($conn),
            'maintenance_history' => getMaintenanceHistory($conn, $startDate, $endDate),
            'technician_performance' => getTechnicianPerformance($conn),
            'location_statistics' => getLocationStatistics($conn)
        ];
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Tipo de relatório inválido']);
        exit;
}

echo json_encode($response);

$conn->close();
?>
