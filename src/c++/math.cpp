#include "math.h"

#include <algorithm>
#include <cmath>

void CreateGaussianFilter(double gKernel[][KERNEL_SIZE])
{
  double sigma = 1.0; // std deviation
  double r;
  double s = 2.0 * sigma * sigma;

  double sum = 0.0; // normalization

  int8_t half = KERNEL_SIZE >> 1;
  for (int8_t x = -half; x <= half; ++x)
  {
    for (int8_t y = -half; y <= half; ++y)
    {
      r = std::sqrt(x*x + y*y);
      gKernel[x + half][y + half] = (std::exp(-(r*r)/s))/(M_PI * s);
      sum += gKernel[x + half][y + half];
    }
  }

  // normalize
  for (int8_t i = 0; i < KERNEL_SIZE; ++i)
  {
    for (int8_t j = 0; j < KERNEL_SIZE; ++j)
        gKernel[i][j] /= sum;
  }
}

bool genSetup = false;
template <class T> T RandRange(T min, T max)
{
  if (min > max)
  {
    T tmp = min;
    max = min;
    min = tmp;
  }
  static std::mt19937 mt;
  if (!genSetup)
  {
    mt.seed(EpochTime());
    genSetup = true;
  }
  std::uniform_real_distribution<T> dist(min, max);
  return dist(mt);
}