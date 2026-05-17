// ===============================
        imageBase64 = await new Promise((resolve) => {

          const reader = new FileReader();

          reader.onload = function (event) {
            resolve(event.target.result);
          };

          reader.readAsDataURL(fileInput.files[0]);

        });
      }

      items.push({
        description: inputs[0]?.value || '',
        condition: inputs[1]?.value || '',
        image: imageBase64,
        partNumber: inputs[3]?.value || '',
        namaBarang: inputs[4]?.value || '',
        qty: inputs[5]?.value || '',
        satuan: inputs[6]?.value || '',
        componentGroup: inputs[7]?.value || '',
        subComponent: inputs[8]?.value || '',
        masukFPB: inputs[9]?.checked || false
      });
    }

    const payload = {
      date: document.getElementById('Date').value,
      site: document.querySelector('input[name="site"]').value,
      codeUnit: document.querySelector('input[name="codeUnit"]').value,
      hourMeter: document.querySelector('input[name="hourMeter"]').value,
      inspectedBy: document.querySelector('input[name="inspectedBy"]').value,
      priority: document.querySelector('input[name="priority"]').value,
      items: items
    };

    console.log('DATA FORM :', payload);

    output.classList.remove('d-none');
    output.innerHTML = '✅ Data inspection berhasil diproses';

    form.reset();

    tableBody.innerHTML = '';

    createRow('inspection');

  } catch (error) {

    console.error(error);

    alert('Terjadi error pada sistem');

  } finally {

    overlay.classList.add('d-none');

  }

});
