import {
  calculateSimulation,
  productivityDays,
  tiers
} from './lib/simulator-rules.mjs';

const $ = id => document.getElementById(id);
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});
const num = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

let previousAward = null;
const productivityDayCount = productivityDays();

function showSimulator(profile, moveFocus = true) {
  $('consultant-name').textContent = profile.name;
  $('branch-name').textContent = profile.branch;
  $('entry-screen').hidden = true;
  $('simulator-page').hidden = false;
  document.body.classList.add('simulator-ready');

  if (moveFocus) {
    $('page-title').setAttribute('tabindex', '-1');
    $('page-title').focus();
  }
}

function showIdentity(moveFocus = true) {
  $('simulator-page').hidden = true;
  $('entry-screen').hidden = false;
  document.body.classList.remove('simulator-ready');
  if (moveFocus) $('person-name').focus();
}

async function registerEntry(profile) {
  const response = await fetch('/api/entradas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Não foi possível salvar a identificação.');
  }
}

function setupIdentity() {
  const form = $('identity-form');
  const nameInput = $('person-name');
  const branchSelect = $('branch');
  const status = $('identity-status');
  const submitButton = form.querySelector('button[type=submit]');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, ' ');

    if (!name) {
      nameInput.setCustomValidity('Digite seu nome.');
      nameInput.reportValidity();
      return;
    }

    nameInput.setCustomValidity('');
    if (!branchSelect.value) {
      branchSelect.reportValidity();
      return;
    }

    const profile = { name, branch: branchSelect.value };
    nameInput.value = name;
    status.dataset.state = 'loading';
    status.textContent = 'Salvando identificação...';
    submitButton.disabled = true;

    try {
      await registerEntry(profile);
      status.textContent = '';
      delete status.dataset.state;
      showSimulator(profile);
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message;
    } finally {
      submitButton.disabled = false;
    }
  });

  nameInput.addEventListener('input', () => {
    nameInput.setCustomValidity('');
    status.textContent = '';
    delete status.dataset.state;
  });

  branchSelect.addEventListener('change', () => {
    status.textContent = '';
    delete status.dataset.state;
  });

  $('change-profile').addEventListener('click', () => {
    showIdentity();
  });

  showIdentity(false);
}

function rowTable(activeTier) {
  $('tier-table').innerHTML = [...tiers].reverse().map(tier => {
    const active = activeTier && tier.faixa === activeTier.faixa;
    const rowClass = active ? 'active' : '';
    const current = active ? ' aria-current=\'true\'' : '';

    return `<tr class='${rowClass}'${current}>
      <th scope='row'>Faixa ${tier.faixa}</th>
      <td>${num.format(tier.total / productivityDayCount)}</td>
      <td>${tier.total}</td>
      <td>${tier.refin}</td>
      <td>${brl.format(tier.refinPrize / tier.refin)}</td>
      <td>${tier.novo}</td>
      <td>${brl.format(tier.novoPrize / tier.novo)}</td>
      <td>${brl.format(tier.max)}</td>
    </tr>`;
  }).join('');
}

function animateAward(value) {
  const award = $('award');
  award.textContent = brl.format(value);

  if (previousAward !== null && previousAward !== value) {
    award.classList.remove('is-updating');
    void award.offsetWidth;
    award.classList.add('is-updating');
  }

  previousAward = value;
}

function simulate() {
  const {
    total,
    tier,
    refinUnit,
    novoUnit,
    paidRefin,
    paidNovo,
    allNewMaximum,
    refinAward,
    novoAward,
    award,
    nextTier
  } = calculateSimulation($('refin').value, $('novo').value);

  $('contracts').textContent = total;
  $('productivity').textContent = num.format(total / productivityDayCount);
  $('productivity-days').textContent = productivityDayCount;
  $('opportunity').textContent = brl.format(
    tier ? Math.max(0, tier.max - award) : 0
  );
  $('refin-award').textContent = brl.format(refinAward);
  $('novo-award').textContent = brl.format(novoAward);
  $('refin-detail').textContent = tier
    ? `${paidRefin} remunerados × ${brl.format(refinUnit)}`
    : 'faixa mínima ainda não atingida';
  $('novo-detail').textContent = tier
    ? allNewMaximum
      ? `${tier.total} novos atingem o prêmio máximo`
      : `${paidNovo} remunerados × ${brl.format(novoUnit)}`
    : 'faixa mínima ainda não atingida';
  $('tier').textContent = tier ? `Faixa ${tier.faixa}` : 'Sem faixa';
  $('tier-status').textContent = tier
    ? 'Meta semanal atingida'
    : `Falta${5 - total === 1 ? '' : 'm'} ${Math.max(0, 5 - total)} contrato${5 - total === 1 ? '' : 's'}`;
  $('progress-label').textContent = `${total} contrato${total === 1 ? '' : 's'}`;
  $('next-label').textContent = nextTier
    ? `Próxima faixa: ${nextTier.total}`
    : 'Faixa máxima alcançada';

  const meter = document.querySelector('.meter');
  meter.setAttribute('aria-valuenow', Math.min(13, total));
  $('meter-fill').style.width = `${Math.min(100, total / 13 * 100)}%`;

  animateAward(award);
  rowTable(tier);
}

['refin', 'novo'].forEach(id => {
  $(id).addEventListener('input', simulate);
});

$('reset').addEventListener('click', () => {
  $('refin').value = 0;
  $('novo').value = 0;
  $('refin').focus();
  simulate();
});

setupIdentity();
simulate();
