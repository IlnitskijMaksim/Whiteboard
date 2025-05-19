from setuptools import setup, Extension
import pybind11

ext_modules = [
    Extension(
        "filter_module",
        ["filter.cpp"],
        include_dirs=[pybind11.get_include()],
        language='c++'

    ),
]

setup(
    name="filter_module",
    ext_modules=ext_modules,
    python_requires=">=3.6",
)