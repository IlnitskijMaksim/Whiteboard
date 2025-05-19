#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <string>
#include <algorithm>

namespace py = pybind11;

std::vector<uint8_t> invert_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result = data;
    for (size_t i = 0; i + 3 < result.size(); i += 4) {
        result[i + 0] = 255 - result[i + 0];
        result[i + 1] = 255 - result[i + 1];
        result[i + 2] = 255 - result[i + 2];
    }
    return result;
}

std::vector<uint8_t> blur_filter(const std::vector<uint8_t>& data, int width, int height) {
    std::vector<uint8_t> result = data;

    auto get_pixel = [&](int x, int y, int channel) -> uint8_t {
        if (x < 0 || y < 0 || x >= width || y >= height) return 0;
        size_t index = (y * width + x) * 4 + channel;
        return data[index];
    };

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            for (int c = 0; c < 3; ++c) {
                int sum = 0;
                int count = 0;
                for (int dy = -1; dy <= 1; ++dy) {
                    for (int dx = -1; dx <= 1; ++dx) {
                        sum += get_pixel(x + dx, y + dy, c);
                        ++count;
                    }
                }
                result[(y * width + x) * 4 + c] = sum / count;
            }
            result[(y * width + x) * 4 + 3] = get_pixel(x, y, 3);
        }
    }
    return result;
}

std::vector<uint8_t> apply_filter_cpp(const std::vector<uint8_t>& data, int width, int height, const std::string& filter_name) {
    if (filter_name == "invert") {
        return invert_filter(data, width, height);
    } else if (filter_name == "blur") {
        return blur_filter(data, width, height);
    }
    return data;
}

PYBIND11_MODULE(filter, m) {
    m.def("apply_filter_cpp", &apply_filter_cpp, "Apply a C++ filter to image data");
}
