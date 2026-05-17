const tableBody = document.querySelector('#itemsTable tbody');

function createRow() {

  const row = document.createElement('tr');

  row.innerHTML = `
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="file" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="number" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="text" class="form-control"></td>
    <td><input type="checkbox"></td>
    <td><button type="button">Hapus</button></td>
  `;

  tableBody.appendChild(row);
}

createRow();
