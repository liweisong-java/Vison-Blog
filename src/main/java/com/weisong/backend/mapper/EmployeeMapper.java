package com.weisong.backend.mapper;
import org.apache.ibatis.annotations.Mapper;
import com.weisong.backend.entities.Employee;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-16-21:17
 */
@Mapper
public interface EmployeeMapper {

    @Select("select * from employee")
    List<Employee> selectAllEmp();
}
