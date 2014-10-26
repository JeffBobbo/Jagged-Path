#ifndef GAUSSIAN_H_INCLUDE
#define GAUSSIAN_H_INCLUDE

#include <vector>
#include <cstdint>

namespace gaussian
{
  typedef std::vector<std::vector<float > > Kernel;
  Kernel GetKernel(uint8_t size);
  void Test();
}
#endif
