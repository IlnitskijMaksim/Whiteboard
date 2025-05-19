#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>

namespace py = pybind11;

std::vector<uint8_t> apply_filter_cpp(const std::vector<uint8_t>& data, 
                                    int width, int height, 
                                    const std::string& filter_name) {
    std::vector<uint8_t> result(data);
    
    if (filter_name == "blur") {
        // Реалізація blur фільтру
        std::vector<uint8_t> temp(data);
        for (int y = 1; y < height - 1; y++) {
            for (int x = 1; x < width - 1; x++) {
                for (int c = 0; c < 3; c++) {  // RGB channels
                    int sum = 0;
                    for (int dy = -1; dy <= 1; dy++) {
                        for (int dx = -1; dx <= 1; dx++) {
                            sum += data[((y + dy) * width + (x + dx)) * 4 + c];
                        }
                    }
                    result[(y * width + x) * 4 + c] = sum / 9;
                }
            }
        }
    } 
    else if (filter_name == "invert") {
        // Реалізація invert фільтру
        for (size_t i = 0; i < data.size(); i += 4) {
            result[i] = 255 - data[i];       // R
            result[i + 1] = 255 - data[i + 1]; // G
            result[i + 2] = 255 - data[i + 2]; // B
            // Alpha channel залишаємо без змін
        }
    }
    
    return result;
}

PYBIND11_MODULE(filter_module, m) {
    m.doc() = "Image filter module"; 
    m.def("apply_filter_cpp", &apply_filter_cpp, 
          "Apply filter to image data",
          py::arg("data"), py::arg("width"), 
          py::arg("height"), py::arg("filter_name"));
}