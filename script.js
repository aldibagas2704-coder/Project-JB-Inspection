// ==========================

        file:
          await new Promise(resolve => {

            if(!file){

              resolve("");
              return;

            }

            const reader =
              new FileReader();

            reader.onload = e =>
              resolve(e.target.result);

            reader.readAsDataURL(file);

          })

      });

    }

    const payload = {

      action:"submitForm",

      date:
        document
        .getElementById("Date")
        ?.value || "",

      site:
        document
        .querySelector(
          'input[name="site"]'
        )?.value || "",

      codeUnit:
        document
        .querySelector(
          'input[name="codeUnit"]'
        )?.value || "",

      hourMeter:
        document
        .querySelector(
          'input[name="hourMeter"]'
        )?.value || "",

      inspectedBy:
        document
        .querySelector(
      
