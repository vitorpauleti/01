let estoque = JSON.parse(localStorage.getItem('estoque')) || [];

// Pedir permissão de notificação
if(Notification.permission !== "granted") Notification.requestPermission();

// Enviar notificação
function enviarNotificacao(texto){
  if(Notification.permission === "granted") 
    new Notification("SmartMarket ⚠️", { body: texto });
}

// Salvar no localStorage
function salvarEstoque() {
  localStorage.setItem('estoque', JSON.stringify(estoque));
}

// Limpar formulário
function limparFormulario(){
  document.getElementById('produto').value='';
  document.getElementById('quantidade').value='';
  document.getElementById('preco').value='';
  document.getElementById('validade').value='';
}

// Adicionar produto
function adicionarProduto(){
  const nome = document.getElementById('produto').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value);
  const preco = parseFloat(document.getElementById('preco').value);
  const validade = document.getElementById('validade').value;

  // Validação correta
  if(!nome || !validade || isNaN(quantidade) || quantidade <= 0 || isNaN(preco) || preco <= 0){
    alert('Preencha todos os campos corretamente!');
    return;
  }

  estoque.push({ id: Date.now(), produto: nome, quantidade, preco, validade });
  salvarEstoque();
  atualizarTabela();
  limparFormulario();
}

// Calcular desconto
function calcularDesconto(diasRestantes, preco){
  let taxa = 0;
  if(diasRestantes <= 7 && diasRestantes >= 5) taxa = 0.10;
  else if(diasRestantes <= 4 && diasRestantes >= 2) taxa = 0.20;
  else if(diasRestantes <= 1) taxa = 0.30;
  return { precoComDesconto: preco*(1-taxa), taxa };
}

// Atualizar tabela e alertas
function atualizarTabela(){
  const tbody = document.querySelector('#tabelaEstoque tbody');
  const alertasDiv = document.getElementById('alertas');
  tbody.innerHTML = '';
  alertasDiv.innerHTML = '';
  const hoje = new Date(); hoje.setHours(0,0,0,0);

  if(estoque.length === 0){
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;">Estoque vazio</td></tr>';
    return;
  }

  estoque.forEach(item=>{
    const tr = document.createElement('tr');
    const validadeData = new Date(item.validade + 'T00:00:00');
    const diasRestantes = Math.ceil((validadeData - hoje)/(1000*60*60*24));
    let status = 'OK';
    if(diasRestantes <= 0) status='Vencido';
    else if(diasRestantes <= 7) status='Próximo do vencimento';

    const { precoComDesconto, taxa } = calcularDesconto(diasRestantes, item.preco);
    if(taxa > 0) tr.classList.add('desconto');

    let tagHtml='';
    if(taxa===0.10) tagHtml='<span class="tag off10">-10%</span>';
    else if(taxa===0.20) tagHtml='<span class="tag off20">-20%</span>';
    else if(taxa===0.30) tagHtml='<span class="tag off30">-30%</span>';

    tr.innerHTML = `<td>${item.produto} ${tagHtml}</td>
      <td>${item.quantidade}</td>
      <td>${item.validade} (${diasRestantes} dia(s))</td>
      <td>${status}</td>
      <td>R$ ${item.preco.toFixed(2)}</td>
      <td>R$ ${precoComDesconto.toFixed(2)}</td>
      <td>
        <button onclick="vender('${item.id}')">Vender</button>
        <button onclick="remover('${item.id}')">Remover</button>
      </td>`;

    tbody.appendChild(tr);

    // Alertas e notificações
    if(diasRestantes>0 && diasRestantes <=3){
      enviarNotificacao(`${item.produto} vence em ${diasRestantes} dia(s)!`);
      const alerta = document.createElement('div');
      alerta.classList.add('alerta');
      alerta.textContent = `${item.produto} vence em ${diasRestantes} dia(s)`;
      alertasDiv.appendChild(alerta);
    }
    if(diasRestantes <= 0){
      const alerta = document.createElement('div');
      alerta.classList.add('alerta');
      alerta.style.backgroundColor='#fde2e2';
      alerta.style.color='#6b0b0b';
      alerta.textContent = `${item.produto} está VENCIDO!`;
      alertasDiv.appendChild(alerta);
    }
  });
}

// Vender produto
function vender(id){
  const item = estoque.find(i=>i.id==id);
  if(!item) return;
  let q = parseInt(prompt(`Quantidade vendida de ${item.produto}:`, '1'));
  if(!q || q <= 0) return alert('Quantidade inválida');
  if(q > item.quantidade) return alert('Estoque insuficiente');
  item.quantidade -= q;
  if(item.quantidade <= 0) estoque = estoque.filter(i=>i.id != id);
  salvarEstoque();
  atualizarTabela();
}

// Remover produto
function remover(id){
  if(!confirm('Remover este produto?')) return;
  estoque = estoque.filter(i=>i.id != id);
  salvarEstoque();
  atualizarTabela();
}

// Atualiza tabela a cada 5 minutos
setInterval(atualizarTabela, 5*60*1000);
atualizarTabela();
