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
        x = std::clamp(x, 0, width - 1);
        y = std::clamp(y, 0, height - 1);
        size_t index = (y * width + x) * 4 + channel;
        return data[index];
    };

    // Гауссове ядро 3x3
    float gaussian_kernel[3][3] = {
        {1.f, 2.f, 1.f},
        {2.f, 4.f, 2.f},
        {1.f, 2.f, 1.f}
    };
    float kernel_sum = 16.f;

    for (int y = 0; y < height; ++y) {
        for (int x = 0; x < width; ++x) {
            float color_sum[3] = {0.f, 0.f, 0.f};  // RGB
            float alpha_sum = 0.f;                // Для альфа-каналу
            float weight_sum = 0.f;

            for (int ky = -1; ky <= 1; ++ky) {
                for (int kx = -1; kx <= 1; ++kx) {
                    int px = x + kx;
                    int py = y + ky;
                    float weight = gaussian_kernel[ky + 1][kx + 1];

                    uint8_t alpha = get_pixel(px, py, 3);  // Альфа-канал сусіднього пікселя
                    if (alpha > 0) {  // Враховувати тільки непрозорі пікселі
                        for (int c = 0; c < 3; ++c) {  // Канали RGB
                            color_sum[c] += get_pixel(px, py, c) * weight * (alpha / 255.f);
                        }
                        alpha_sum += alpha * weight;
                        weight_sum += weight;
                    }
                }
            }

            for (int c = 0; c < 3; ++c) {
                result[(y * width + x) * 4 + c] = static_cast<uint8_t>(color_sum[c] / (weight_sum * (alpha_sum / kernel_sum) + 1e-5f));
            }
            result[(y * width + x) * 4 + 3] = get_pixel(x, y, 3);  // Альфа-канал без змін
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
