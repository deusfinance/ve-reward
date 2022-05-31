from multicall.call import Call
from multicall.multicall import Multicall
from web3 import Web3
import matplotlib.pyplot as plt


def get_points():
    start = 33657905
    end = 39131332
    diff_block = 42300
    days = (end - start) // diff_block
    end = start + diff_block
    total_supply = []
    times = []
    for _ in range(days):
        calls = []
        for time in range(start, end, 120):
            calls.append(
                Call(
                    w3,
                    contract_address,
                    ["totalSupplyAt(uint256)(uint256)", time],
                    [[time, None]],
                )
            )
        points = Multicall(w3, calls)()
        for point in points:
            total_supply.append(points[point][0] / 10**18)
            times.append(point)
        start += diff_block
        end += diff_block
    fig, ax = plt.subplots()
    ax.plot(times, total_supply)


if __name__ == "__main__":
    contract_address = "0x8B42c6Cb07c8dD5fE5dB3aC03693867AFd11353d"
    w3 = Web3(Web3.HTTPProvider("https://rpc.ftm.tools"))
    get_points()
    plt.show()
