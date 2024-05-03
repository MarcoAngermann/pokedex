function renderChart(chartId, stats) {
  const ctx = document.getElementById(chartId);
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['hp', 'attack', 'defense','spec-attack','spec-def','speed'],
      datasets: [{
        label: 'Pokémon stats',
        data: stats,
        borderWidth: 1,
        fill: true,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(0, 0, 0)',
        pointBorderColor: 'rgb(0, 0, 0)',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
      }]
    },
    options: {
      scale: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.3)',
        },
        gridLines: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 2
        },
        pointLabels: {
          fontColor: 'rgba(255, 255, 255, 0.8)',
        }
      },
      legend: {
        labels: {
          fontColor: 'rgba(255, 255, 255, 0.8)',
        }
      }
    }
  });
};

