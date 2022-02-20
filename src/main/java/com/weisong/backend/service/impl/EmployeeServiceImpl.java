package com.weisong.backend.service.impl;

import com.weisong.backend.entities.Employee;
import com.weisong.backend.mapper.EmployeeMapper;
import com.weisong.backend.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.validation.constraints.Email;
import java.util.List;

/**
 * @author 李伟松
 * @create 2022-02-16-19:37
 */
@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    EmployeeMapper employeeMapper;

    @Override
    public List<Employee> getAllEmp() {
        return employeeMapper.getAllEmp();
    }   

    @Override
    public Long insertEmp(Employee employee) {
        return employeeMapper.insertEmp(employee.getLastName(),employee.getEmail(),employee.getGender(),employee.getDepartmentName(),employee.getBirth());
    }

    @Override
    public void deleteEmpById(Integer emp_id) {
        employeeMapper.deleteEmpById(emp_id);
    }
}
