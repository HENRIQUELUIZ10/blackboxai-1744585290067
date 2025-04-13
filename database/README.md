# Banco de Dados - Sistema de Manutenção Preventiva

Este diretório contém os scripts SQL para criar e inicializar o banco de dados do sistema.

## Estrutura do Banco de Dados

O banco de dados `manutencao_preventiva` consiste nas seguintes tabelas:

### 1. Técnicos (`tecnicos`)
- Armazena informações dos técnicos de manutenção
- Campos:
  - `id`: Identificador único (AUTO_INCREMENT)
  - `nome`: Nome do técnico
  - `especialidade`: Área de especialização
  - `telefone`: Número de contato
  - `email`: Email para contato
  - `disponibilidade`: Status atual (available, busy, vacation, leave)
  - `observacoes`: Notas adicionais
  - `created_at`: Data de criação
  - `updated_at`: Data de última atualização

### 2. Manutenções (`manutencoes`)
- Registra as manutenções preventivas
- Campos:
  - `id`: Identificador único (AUTO_INCREMENT)
  - `titulo`: Título da manutenção
  - `descricao`: Descrição detalhada
  - `data_prevista`: Data programada
  - `periodicidade`: Frequência de repetição
  - `local`: Local da manutenção
  - `status`: Estado atual (pending, in-progress, completed, delayed)
  - `observacoes`: Notas adicionais
  - `created_at`: Data de criação
  - `updated_at`: Data de última atualização

### 3. Relacionamento Manutenção-Técnico (`manutencao_tecnicos`)
- Associa técnicos às manutenções
- Campos:
  - `manutencao_id`: ID da manutenção (FOREIGN KEY)
  - `tecnico_id`: ID do técnico (FOREIGN KEY)

### 4. Itens do Checklist (`checklist_items`)
- Armazena os itens de verificação de cada manutenção
- Campos:
  - `id`: Identificador único (AUTO_INCREMENT)
  - `manutencao_id`: ID da manutenção relacionada (FOREIGN KEY)
  - `descricao`: Descrição do item
  - `status`: Estado do item (pending, completed, not-applicable)
  - `comentarios`: Observações sobre o item
  - `ordem`: Ordem de exibição
  - `created_at`: Data de criação
  - `updated_at`: Data de última atualização

## Índices
O banco de dados inclui os seguintes índices para otimização:
- `idx_manutencoes_data_prevista`: Otimiza consultas por data
- `idx_manutencoes_status`: Otimiza filtros por status
- `idx_tecnicos_disponibilidade`: Otimiza consultas por disponibilidade
- `idx_checklist_status`: Otimiza filtros por status do checklist

## Como Inicializar o Banco de Dados

1. Certifique-se de ter o MySQL instalado e em execução

2. Execute o script SQL:
   ```bash
   mysql -u root -p < schema.sql
   ```

3. Verifique se o banco de dados foi criado:
   ```sql
   SHOW DATABASES;
   USE manutencao_preventiva;
   SHOW TABLES;
   ```

## Dados de Exemplo

O script inclui dados de exemplo para teste:
- 3 técnicos com diferentes especialidades
- 3 manutenções em diferentes estados
- Itens de checklist para cada manutenção
- Relacionamentos entre técnicos e manutenções

## Configuração da Conexão

As configurações de conexão com o banco de dados estão no arquivo `config/database.php`:
- Host: localhost
- Usuário: root
- Senha: (definida durante a instalação do MySQL)
- Banco de dados: manutencao_preventiva

## Manutenção

Para backup do banco de dados:
```bash
mysqldump -u root -p manutencao_preventiva > backup.sql
```

Para restaurar um backup:
```bash
mysql -u root -p manutencao_preventiva < backup.sql
